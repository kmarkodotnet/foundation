using FluentValidation;

namespace GrantManagement.Application.Auth.Commands.AcceptInvitation;

public class AcceptInvitationCommandValidator : AbstractValidator<AcceptInvitationCommand>
{
    public AcceptInvitationCommandValidator()
    {
        RuleFor(x => x.AuthorizationCode)
            .NotEmpty().WithMessage("Az authorization code kötelező.");

        RuleFor(x => x.RedirectUri)
            .NotEmpty().WithMessage("A redirect URI kötelező.");

        RuleFor(x => x.InvitationToken)
            .NotEmpty().WithMessage("A meghívó token kötelező.");
    }
}
