using FluentValidation;
using GrantManagement.Application.OwnerAdministration.Users.DTOs;
using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Users.Commands.InviteOwnerUser;

public record InviteOwnerUserCommand(
    string Email,
    List<FoundationRoleAssignment> FoundationAssignments) : IRequest<InviteOwnerUserResponse>;

public record InviteOwnerUserResponse(Guid InvitationId);

public class InviteOwnerUserCommandValidator : AbstractValidator<InviteOwnerUserCommand>
{
    public InviteOwnerUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Érvényes e-mail cím szükséges.")
            .EmailAddress().WithMessage("Érvényes e-mail cím szükséges.");

        RuleFor(x => x.FoundationAssignments)
            .NotEmpty().WithMessage("Legalább egy Foundation-hozzárendelés kötelező.");
    }
}
