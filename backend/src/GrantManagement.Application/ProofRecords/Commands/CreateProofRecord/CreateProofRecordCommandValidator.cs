using FluentValidation;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.ProofRecords.Commands.CreateProofRecord;

public class CreateProofRecordCommandValidator : AbstractValidator<CreateProofRecordCommand>
{
    public CreateProofRecordCommandValidator()
    {
        RuleFor(x => x.ProofType)
            .NotEmpty().WithMessage("Igazolás típusa kötelező.")
            .Must(BeValidProofType).WithMessage("Érvénytelen igazolás típus.");

        RuleFor(x => x.EventDate)
            .NotEmpty().WithMessage("A teljesítés dátuma kötelező.");

        RuleFor(x => x.Photos)
            .NotEmpty().WithMessage("Legalább 1 fotó feltöltése kötelező.");
    }

    private static bool BeValidProofType(string proofType)
        => Enum.TryParse<ProofRecordType>(proofType, ignoreCase: true, out _);
}
