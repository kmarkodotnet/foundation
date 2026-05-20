using FluentValidation;

namespace GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;

public class UpdateSubmissionStepCommandValidator : AbstractValidator<UpdateSubmissionStepCommand>
{
    public UpdateSubmissionStepCommandValidator()
    {
        RuleFor(x => x.SubmittedAt)
            .NotEmpty().WithMessage("A beadás időpontja kötelező.")
            .LessThanOrEqualTo(_ => DateTimeOffset.UtcNow).WithMessage("A beadás időpontja nem lehet jövőbeli.");
    }
}
