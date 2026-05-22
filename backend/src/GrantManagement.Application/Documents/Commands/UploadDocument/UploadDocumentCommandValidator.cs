using FluentValidation;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Documents.Commands.UploadDocument;

public class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
{
    public UploadDocumentCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty().WithMessage("Az alkalmazás azonosítója kötelező.");

        RuleFor(x => x.DocumentType)
            .IsInEnum().WithMessage("Érvénytelen dokumentumtípus.");

        RuleFor(x => x.DisplayName)
            .MaximumLength(255).WithMessage("A megjelenítési név legfeljebb 255 karakter lehet.")
            .When(x => x.DisplayName is not null);

        RuleFor(x => x.File)
            .NotNull().WithMessage("A fájl feltöltése kötelező.");
    }
}
