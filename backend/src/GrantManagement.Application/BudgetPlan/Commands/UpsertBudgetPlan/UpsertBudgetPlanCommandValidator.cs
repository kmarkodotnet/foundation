using FluentValidation;

namespace GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;

public class UpsertBudgetPlanCommandValidator : AbstractValidator<UpsertBudgetPlanCommand>
{
    public UpsertBudgetPlanCommandValidator()
    {
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Name)
                .NotEmpty().WithMessage("A tétel neve kötelező.");

            item.RuleFor(i => i.PlannedAmount)
                .GreaterThan(0).WithMessage("A tervezett összegnek pozitívnak kell lennie.");
        });
    }
}
