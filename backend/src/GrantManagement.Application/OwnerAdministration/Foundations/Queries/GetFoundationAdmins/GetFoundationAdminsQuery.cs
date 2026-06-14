using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Queries.GetFoundationAdmins;

public record GetFoundationAdminsQuery(Guid FoundationId) : IRequest<IReadOnlyList<FoundationAdminListItemResponse>>;

public record FoundationAdminListItemResponse(
    Guid UserId,
    string Email,
    string FullName,
    string Role,
    DateTimeOffset AssignedAt);
