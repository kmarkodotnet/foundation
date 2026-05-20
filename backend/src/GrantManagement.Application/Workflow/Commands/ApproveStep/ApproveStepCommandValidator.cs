using FluentValidation;

namespace GrantManagement.Application.Workflow.Commands.ApproveStep;

public class ApproveStepCommandValidator : AbstractValidator<ApproveStepCommand>
{
    public ApproveStepCommandValidator()
    {
        RuleFor(x => x.RejectionNote)
            .NotEmpty()
            .WithMessage("Visszautasítás esetén meg kell adni az okát.")
            .When(x => !x.IsApproved);
    }
}
