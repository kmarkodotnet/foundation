using FluentValidation;

namespace GrantManagement.Application.Vendors.Commands.UpdateVendor;

public class UpdateVendorCommandValidator : AbstractValidator<UpdateVendorCommand>
{
    public UpdateVendorCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("A cég neve kötelező.")
            .MaximumLength(300).WithMessage("A cég neve maximum 300 karakter lehet.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Érvénytelen e-mail cím formátum.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("A telefonszám maximum 50 karakter lehet.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("A cím maximum 500 karakter lehet.")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));
    }
}
