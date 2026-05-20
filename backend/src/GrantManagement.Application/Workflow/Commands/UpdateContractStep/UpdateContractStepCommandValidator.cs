using FluentValidation;

namespace GrantManagement.Application.Workflow.Commands.UpdateContractStep;

public class UpdateContractStepCommandValidator : AbstractValidator<UpdateContractStepCommand>
{
    public UpdateContractStepCommandValidator()
    {
        RuleFor(x => x.NotificationDate)
            .NotEmpty().WithMessage("Értesítő dátuma kötelező, ha értesítő érkezett.")
            .When(x => x.NotificationReceived);
    }
}
