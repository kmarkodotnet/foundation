using FluentValidation;

namespace GrantManagement.Application.Documents.Commands.UploadDocumentVersion;

public class UploadDocumentVersionCommandValidator : AbstractValidator<UploadDocumentVersionCommand>
{
    public UploadDocumentVersionCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty().WithMessage("Az alkalmazás azonosítója kötelező.");

        RuleFor(x => x.DocumentId)
            .NotEmpty().WithMessage("A dokumentum azonosítója kötelező.");

        RuleFor(x => x.DisplayName)
            .MaximumLength(255).WithMessage("A megjelenítési név legfeljebb 255 karakter lehet.")
            .When(x => x.DisplayName is not null);

        RuleFor(x => x.File)
            .NotNull().WithMessage("A fájl feltöltése kötelező.");
    }
}
