using FluentValidation;

namespace GrantManagement.Application.Comments.Commands.AddComment;

public class AddCommentCommandValidator : AbstractValidator<AddCommentCommand>
{
    public AddCommentCommandValidator()
    {
        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("A megjegyzés tartalma kötelező.")
            .MaximumLength(2000).WithMessage("A megjegyzés maximum 2000 karakter lehet.");
    }
}
