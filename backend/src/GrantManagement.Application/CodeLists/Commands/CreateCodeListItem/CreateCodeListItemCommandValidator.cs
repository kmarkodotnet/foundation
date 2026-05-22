using FluentValidation;

namespace GrantManagement.Application.CodeLists.Commands.CreateCodeListItem;

public class CreateCodeListItemCommandValidator : AbstractValidator<CreateCodeListItemCommand>
{
    public CreateCodeListItemCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("A kód megadása kötelező és egyedinek kell lennie.")
            .MaximumLength(100).WithMessage("A kód maximum 100 karakter lehet.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("A megnevezés kötelező.")
            .MaximumLength(300).WithMessage("A megnevezés maximum 300 karakter lehet.");
    }
}
