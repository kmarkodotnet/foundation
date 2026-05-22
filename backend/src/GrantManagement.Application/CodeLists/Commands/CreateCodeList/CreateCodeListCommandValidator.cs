using FluentValidation;

namespace GrantManagement.Application.CodeLists.Commands.CreateCodeList;

public class CreateCodeListCommandValidator : AbstractValidator<CreateCodeListCommand>
{
    public CreateCodeListCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("A kódszótár neve kötelező.")
            .MaximumLength(200).WithMessage("A kódszótár neve maximum 200 karakter lehet.");
    }
}
