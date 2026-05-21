using FluentValidation;

namespace GrantManagement.Application.VendorContracts.Commands.CreateVendorContract;

public class CreateVendorContractCommandValidator : AbstractValidator<CreateVendorContractCommand>
{
    public CreateVendorContractCommandValidator()
    {
        RuleFor(x => x.VendorId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Currency).NotEmpty().MaximumLength(3);
        RuleFor(x => x.ContractIdentifier).MaximumLength(100).When(x => x.ContractIdentifier != null);
        RuleFor(x => x.Notes).MaximumLength(2000).When(x => x.Notes != null);
    }
}
