using FluentValidation;

namespace GrantManagement.Application.Settlement.Commands.ApproveSettlement;

public class ApproveSettlementCommandValidator : AbstractValidator<ApproveSettlementCommand>
{
    public ApproveSettlementCommandValidator()
    {
        RuleFor(x => x.RejectionNote)
            .NotEmpty()
            .When(x => !x.IsApproved)
            .WithMessage("Visszautasítás esetén meg kell adni az okát.");
    }
}
