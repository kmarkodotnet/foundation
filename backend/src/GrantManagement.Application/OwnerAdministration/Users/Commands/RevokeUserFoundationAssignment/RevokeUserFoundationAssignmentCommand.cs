using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Users.Commands.RevokeUserFoundationAssignment;

public record RevokeUserFoundationAssignmentCommand(Guid TargetUserId, Guid FoundationId) : IRequest;
