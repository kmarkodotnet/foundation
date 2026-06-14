using GrantManagement.Domain.Tenancy.Enums;
using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Users.Commands.AssignUserToFoundation;

public record AssignUserToFoundationCommand(
    Guid TargetUserId,
    Guid FoundationId,
    FoundationRole Role) : IRequest<AssignUserToFoundationResponse>;

public record AssignUserToFoundationResponse(Guid AssignmentId, Guid UserId, Guid FoundationId, string Role);
