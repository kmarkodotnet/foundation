using FluentValidation;

namespace GrantManagement.Application.Granters.Commands.CreateGranter;

public class CreateGranterCommandValidator : AbstractValidator<CreateGranterCommand>
{
    public CreateGranterCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("A pályáztató neve kötelező.")
            .MaximumLength(300).WithMessage("A pályáztató neve maximum 300 karakter lehet.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Érvénytelen e-mail cím formátum.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50).WithMessage("A telefonszám maximum 50 karakter lehet.")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));
    }
}
