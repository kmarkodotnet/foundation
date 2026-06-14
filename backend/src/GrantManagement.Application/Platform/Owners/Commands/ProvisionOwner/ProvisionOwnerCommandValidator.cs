using FluentValidation;

namespace GrantManagement.Application.Platform.Owners.Commands.ProvisionOwner;

public sealed class ProvisionOwnerCommandValidator : AbstractValidator<ProvisionOwnerCommand>
{
    public ProvisionOwnerCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200)
            .WithMessage("Az Owner neve kötelező és maximum 200 karakter.");

        RuleFor(x => x.ContactEmail)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Érvényes kapcsolattartó e-mail szükséges.");

        RuleFor(x => x.InitialOwnerAdminEmail)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Érvényes OwnerAdmin e-mail szükséges.");
    }
}
