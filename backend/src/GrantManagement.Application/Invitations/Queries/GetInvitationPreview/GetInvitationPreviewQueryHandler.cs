using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Tenancy.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invitations.Queries.GetInvitationPreview;

public sealed class GetInvitationPreviewQueryHandler : IRequestHandler<GetInvitationPreviewQuery, InvitationPreviewResponse>
{
    private readonly IApplicationDbContext _db;

    public GetInvitationPreviewQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<InvitationPreviewResponse> Handle(GetInvitationPreviewQuery request, CancellationToken cancellationToken)
    {
        var invitation = await _db.Invitations
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Token == request.Token, cancellationToken)
            ?? throw new NotFoundException("Invitation", request.Token);

        if (invitation.Status == InvitationStatus.Revoked)
            throw new DomainException("Ez a meghívó vissza lett vonva.");

        string? ownerName = null;
        string? foundationName = null;

        if (invitation.OwnerId.HasValue)
        {
            ownerName = await _db.Owners
                .AsNoTracking()
                .Where(o => o.Id == invitation.OwnerId.Value)
                .Select(o => o.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (invitation.FoundationId.HasValue)
        {
            foundationName = await _db.Foundations
                .AsNoTracking()
                .Where(f => f.Id == invitation.FoundationId.Value)
                .Select(f => f.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var role = invitation.Scope switch
        {
            AssignmentScope.Platform => invitation.PlatformRole?.ToString(),
            AssignmentScope.Owner => invitation.OwnerRole?.ToString(),
            AssignmentScope.Foundation => invitation.FoundationRole?.ToString(),
            _ => null
        };

        return new InvitationPreviewResponse(
            invitation.Email,
            invitation.Scope.ToString(),
            role,
            invitation.OwnerId,
            ownerName,
            invitation.FoundationId,
            foundationName,
            invitation.ExpiresAt < DateTimeOffset.UtcNow || invitation.Status == InvitationStatus.Expired);
    }
}
