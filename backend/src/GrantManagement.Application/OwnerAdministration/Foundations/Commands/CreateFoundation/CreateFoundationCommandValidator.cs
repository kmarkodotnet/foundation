using FluentValidation;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.CreateFoundation;

public sealed class CreateFoundationCommandValidator : AbstractValidator<CreateFoundationCommand>
{
    public CreateFoundationCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200).WithMessage("Az alapítvány neve kötelező.");
        RuleFor(x => x.InitialFoundationAdminEmail).NotEmpty().EmailAddress().WithMessage("Érvényes FoundationAdmin e-mail szükséges.");
    }
}
