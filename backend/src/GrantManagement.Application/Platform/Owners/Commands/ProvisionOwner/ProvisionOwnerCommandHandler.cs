using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
using GrantManagement.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Platform.Owners.Commands.ProvisionOwner;

public sealed class ProvisionOwnerCommandHandler : IRequestHandler<ProvisionOwnerCommand, ProvisionOwnerResponse>
{
    private readonly IApplicationDbContext _db;

    public ProvisionOwnerCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ProvisionOwnerResponse> Handle(ProvisionOwnerCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.InitialOwnerAdminEmail.Trim().ToLowerInvariant();

        var emailTaken = await _db.AppUsers
            .AnyAsync(u => u.Email == normalizedEmail && u.OwnerId.HasValue, cancellationToken);
        if (emailTaken)
            throw new DomainException("Ez az e-mail cím már egy másik Owner-hez tartozik.");

        var owner = Owner.Create(request.Name, request.ContactEmail);
        _db.Owners.Add(owner);

        var invitation = Invitation.CreateForScope(
            email: request.InitialOwnerAdminEmail,
            scope: AssignmentScope.Owner,
            ownerId: owner.Id,
            ownerRole: OwnerRole.OwnerAdmin,
            expiryHours: 72);
        _db.Invitations.Add(invitation);

        await _db.SaveChangesAsync(cancellationToken);

        return new ProvisionOwnerResponse(owner.Id, owner.Name, owner.Status.ToString());
    }
}
