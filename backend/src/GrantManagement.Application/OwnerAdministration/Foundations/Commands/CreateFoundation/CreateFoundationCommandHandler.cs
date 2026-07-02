using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.Tenancy;
using GrantManagement.Domain.Tenancy.Enums;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.CreateFoundation;

public sealed class CreateFoundationCommandHandler : IRequestHandler<CreateFoundationCommand, CreateFoundationResponse>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentScopeService _scope;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailService _emailService;
    private readonly IInvitationLinkBuilder _linkBuilder;

    public CreateFoundationCommandHandler(
        IApplicationDbContext db,
        ICurrentScopeService scope,
        ICurrentUserService currentUser,
        IEmailService emailService,
        IInvitationLinkBuilder linkBuilder)
    {
        _db = db;
        _scope = scope;
        _currentUser = currentUser;
        _emailService = emailService;
        _linkBuilder = linkBuilder;
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

        if (request.TemplateFoundationId.HasValue)
            await CopyFromTemplateFoundationAsync(request.TemplateFoundationId.Value, ownerId, foundation.Id, cancellationToken);

        await ApplyOwnerCodeListTemplatesAsync(ownerId, foundation.Id, cancellationToken);

        var settings = await _db.PlatformSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        var invitation = Invitation.CreateForScope(
            email: request.InitialFoundationAdminEmail,
            scope: AssignmentScope.Foundation,
            foundationId: foundation.Id,
            foundationRole: FoundationRole.FoundationAdmin,
            expiryHours: settings?.InvitationExpiryHours ?? 72);
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
            _linkBuilder.BuildAcceptUrl(invitation.Token),
            cancellationToken);

        return new CreateFoundationResponse(foundation.Id, foundation.Name, foundation.Status.ToString());
    }

    /// <summary>
    /// NK-15: a sablonalapítvány aktív Granter és Vendor rekordjai snapshot-ként
    /// átmásolódnak az új alapítványba (nem referencia).
    /// </summary>
    private async Task CopyFromTemplateFoundationAsync(
        Guid templateFoundationId,
        Guid ownerId,
        Guid newFoundationId,
        CancellationToken cancellationToken)
    {
        var templateGranters = await _db.Granters
            .AsNoTracking()
            .Where(g => g.FoundationId == templateFoundationId && g.Status == GranterStatus.Active)
            .ToListAsync(cancellationToken);

        foreach (var granter in templateGranters)
        {
            _db.Granters.Add(Granter.Create(
                granter.Name,
                granter.Description,
                new ContactInfo(granter.Contact.PhoneNumber, granter.Contact.Email),
                ownerId,
                newFoundationId));
        }

        var templateVendors = await _db.Vendors
            .AsNoTracking()
            .Where(v => v.FoundationId == templateFoundationId && v.Status == VendorStatus.Active)
            .ToListAsync(cancellationToken);

        foreach (var vendor in templateVendors)
        {
            _db.Vendors.Add(Vendor.Create(
                vendor.Name,
                vendor.TaxNumber is null ? null : new TaxNumber(vendor.TaxNumber.Value),
                vendor.Address,
                new ContactInfo(vendor.Contact.PhoneNumber, vendor.Contact.Email),
                ownerId,
                newFoundationId));
        }
    }

    /// <summary>
    /// NK-16: az Owner-szintű kódszótár-sablonok az új alapítvány kódszótáraiba
    /// snapshot-ként átmásolódnak.
    /// </summary>
    private async Task ApplyOwnerCodeListTemplatesAsync(
        Guid ownerId,
        Guid newFoundationId,
        CancellationToken cancellationToken)
    {
        var templates = await _db.OwnerCodeListTemplates
            .AsNoTracking()
            .Include(t => t.Items)
            .Where(t => t.OwnerId == ownerId && t.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var template in templates)
        {
            var codeList = CodeList.Create(
                template.Name,
                description: null,
                isSystem: false,
                ownerId: ownerId,
                foundationId: newFoundationId);

            foreach (var item in template.Items.Where(i => !i.IsDeleted).OrderBy(i => i.Order))
                codeList.AddItem(item.Value, item.Label, description: null);

            _db.CodeLists.Add(codeList);
        }
    }
}
