using FluentValidation;

namespace GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;

public class CreateEmailRecordCommandValidator : AbstractValidator<CreateEmailRecordCommand>
{
    private static readonly string[] ValidDirections = ["In", "Out"];

    public CreateEmailRecordCommandValidator()
    {
        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("A tárgy megadása kötelező.");

        RuleFor(x => x.SenderEmail)
            .NotEmpty().WithMessage("A feladó e-mail cím megadása kötelező.")
            .EmailAddress().WithMessage("Érvénytelen e-mail cím formátum.");

        RuleFor(x => x.SentDate)
            .NotEqual(default(DateOnly)).WithMessage("A küldés dátuma kötelező.");

        RuleFor(x => x.Direction)
            .NotEmpty().WithMessage("Az irány megadása kötelező.")
            .Must(d => ValidDirections.Contains(d))
            .WithMessage("Az irány csak 'In' vagy 'Out' lehet.");
    }
}
