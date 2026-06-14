using GrantManagement.Domain.Tenancy.Enums;
using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.AssignFoundationAdmin;

public record AssignFoundationAdminCommand(
    Guid FoundationId,
    Guid TargetUserId,
    FoundationRole Role) : IRequest<AssignFoundationAdminResponse>;

public record AssignFoundationAdminResponse(Guid AssignmentId, Guid UserId, string Role);
