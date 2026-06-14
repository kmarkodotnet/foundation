using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.RevokeFoundationAdmin;

public record RevokeFoundationAdminCommand(Guid FoundationId, Guid TargetUserId) : IRequest;
