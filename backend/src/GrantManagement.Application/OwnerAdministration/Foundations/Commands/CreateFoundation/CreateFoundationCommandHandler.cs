using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.CreateFoundation;

public sealed class CreateFoundationCommandHandler : IRequestHandler<CreateFoundationCommand, CreateFoundationResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailService _emailService;

    public CreateFoundationCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser,
        IEmailService emailService)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
        _emailService = emailService;
    }

    public async Task<CreateFoundationResponse> Handle(CreateFoundationCommand request, CancellationToken cancellationToken)
    {
        var ownerId = _scope.OwnerId
            ?? throw new ForbiddenException("Owner hatókör szükséges Foundation létrehozásához.");

        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == ownerId, cancellationToken)
            ?? throw new NotFoundException("Owner", ownerId);

        if (owner.Status != OwnerStatus.Active)
            throw new DomainException("Csak aktív Owner alá hozható létre alapítvány.");

        if (request.TemplateFoundationId.HasValue)
        {
            var templateExists = await _db.Foundations
                .AsNoTracking()
                .AnyAsync(f => f.Id == request.TemplateFoundationId.Value && f.OwnerId == ownerId, cancellationToken);
            if (!templateExists)
                throw new DomainException("A sablon-alapítvány nem ehhez az Owner-hez tartozik.");
        }

        var foundation = Foundation.Create(ownerId, request.Name, request.LogoUri);
        _db.Foundations.Add(foundation);

        var invitation = Invitation.CreateForScope(
            email: request.InitialFoundationAdminEmail,
            scope: AssignmentScope.Foundation,
            foundationId: foundation.Id,
            foundationRole: FoundationRole.FoundationAdmin,
            expiryHours: 72);
        _db.Invitations.Add(invitation);

        _db.AuditLogs.Add(AuditLog.Record(
            entityType: "Foundation",
            entityId: foundation.Id,
            action: AuditAction.FoundationCreated,
            userId: _currentUser.UserId,
            ipAddress: _currentUser.IpAddress,
            ownerId: ownerId,
            foundationId: foundation.Id));

        await _db.SaveChangesAsync(cancellationToken);

        await _emailService.SendInvitationAsync(
            request.InitialFoundationAdminEmail,
            invitation.Token,
            cancellationToken);

        return new CreateFoundationResponse(foundation.Id, foundation.Name, foundation.Status.ToString());
    }
}
