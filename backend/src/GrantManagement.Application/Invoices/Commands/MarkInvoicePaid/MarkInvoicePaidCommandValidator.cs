using FluentValidation;

namespace GrantManagement.Application.Invoices.Commands.MarkInvoicePaid;

public class MarkInvoicePaidCommandValidator : AbstractValidator<MarkInvoicePaidCommand>
{
    public MarkInvoicePaidCommandValidator()
    {
        RuleFor(x => x.PaymentDate)
            .NotEmpty().WithMessage("A fizetés dátuma kötelező.");
    }
}
