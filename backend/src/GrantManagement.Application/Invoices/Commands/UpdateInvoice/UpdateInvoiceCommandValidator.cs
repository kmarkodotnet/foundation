using FluentValidation;

namespace GrantManagement.Application.Invoices.Commands.UpdateInvoice;

public class UpdateInvoiceCommandValidator : AbstractValidator<UpdateInvoiceCommand>
{
    public UpdateInvoiceCommandValidator()
    {
        RuleFor(x => x.SupplierName)
            .NotEmpty().WithMessage("A szállító neve kötelező.")
            .MaximumLength(300);

        RuleFor(x => x.InvoiceNumber)
            .NotEmpty().WithMessage("A számla sorszáma kötelező.")
            .MaximumLength(100);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Az összegnek pozitívnak kell lennie.");

        RuleFor(x => x.PaymentDate)
            .NotEmpty().WithMessage("Fizetés dátuma kötelező, ha a számla fizetve van.")
            .When(x => x.IsPaid);

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .When(x => x.Notes != null);
    }
}
