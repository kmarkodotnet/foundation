using FluentValidation;

namespace GrantManagement.Application.Invitations.Commands.ResendInvitation;

public class ResendInvitationCommandValidator : AbstractValidator<ResendInvitationCommand>
{
    public ResendInvitationCommandValidator()
    {
        RuleFor(x => x.InvitationId)
            .NotEmpty().WithMessage("A meghívó azonosítója kötelező.");

        RuleFor(x => x.FrontendBaseUrl)
            .NotEmpty().WithMessage("A frontend alap URL kötelező.");
    }
}
