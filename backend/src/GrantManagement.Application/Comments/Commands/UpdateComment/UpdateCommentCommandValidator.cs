using FluentValidation;

namespace GrantManagement.Application.Comments.Commands.UpdateComment;

public class UpdateCommentCommandValidator : AbstractValidator<UpdateCommentCommand>
{
    public UpdateCommentCommandValidator()
    {
        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("A megjegyzés tartalma kötelező.")
            .MaximumLength(2000).WithMessage("A megjegyzés maximum 2000 karakter lehet.");
    }
}
