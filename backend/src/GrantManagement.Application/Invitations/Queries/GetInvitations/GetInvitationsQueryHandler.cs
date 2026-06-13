using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invitations.Commands.CreateInvitation;
using GrantManagement.Application.Invitations.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invitations.Queries.GetInvitations;

public class GetInvitationsQueryHandler
    : IRequestHandler<GetInvitationsQuery, IReadOnlyList<InvitationResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetInvitationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<InvitationResponse>> Handle(
        GetInvitationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Invitations.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.StatusFilter)
            && Enum.TryParse<InvitationStatus>(request.StatusFilter, ignoreCase: true, out var statusFilter))
        {
            query = query.Where(i => i.Status == statusFilter);
        }

        var invitations = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        return invitations.Select(CreateInvitationCommandHandler.ToResponse).ToList();
    }
}
