using FluentValidation;

namespace GrantManagement.Application.Invitations.Commands.RevokeInvitation;

public class RevokeInvitationCommandValidator : AbstractValidator<RevokeInvitationCommand>
{
    public RevokeInvitationCommandValidator()
    {
        RuleFor(x => x.InvitationId)
            .NotEmpty().WithMessage("A meghívó azonosítója kötelező.");
    }
}
