using FluentValidation;

namespace GrantManagement.Application.Settlement.Commands.RecordSettlement;

public class RecordSettlementCommandValidator : AbstractValidator<RecordSettlementCommand>
{
    public RecordSettlementCommandValidator()
    {
        RuleFor(x => x.SettlementDate)
            .NotEmpty()
            .WithMessage("Az elszámolás időpontja kötelező.");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .WithMessage("A leírás legfeljebb 2000 karakter lehet.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .WithMessage("A megjegyzés legfeljebb 2000 karakter lehet.");
    }
}
