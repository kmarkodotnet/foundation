using FluentValidation;

namespace GrantManagement.Application.Workflow.Commands.RecordResult;

public class RecordResultCommandValidator : AbstractValidator<RecordResultCommand>
{
    public RecordResultCommandValidator()
    {
        RuleFor(x => x.AwardedAmount)
            .GreaterThan(0).WithMessage("Az elnyert összegnek pozitívnak kell lennie.")
            .When(x => x.IsWon);

        RuleFor(x => x.AwardedAmount)
            .Null().WithMessage("Nem nyert esetén az összeg nem adható meg.")
            .When(x => !x.IsWon);

        RuleFor(x => x.ResultDate)
            .NotEmpty().WithMessage("Az eredmény dátuma kötelező.")
            .When(x => x.IsWon);
    }
}
