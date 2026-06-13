using FluentValidation;

namespace GrantManagement.Application.Invitations.Commands.CreateInvitation;

public class CreateInvitationCommandValidator : AbstractValidator<CreateInvitationCommand>
{
    public CreateInvitationCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Az email-cím kötelező.")
            .EmailAddress().WithMessage("Érvényes email-cím szükséges.")
            .MaximumLength(300).WithMessage("Az email-cím legfeljebb 300 karakter lehet.");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Érvényes szerepkör szükséges.");

        RuleFor(x => x.FrontendBaseUrl)
            .NotEmpty().WithMessage("A frontend alap URL kötelező.");
    }
}
