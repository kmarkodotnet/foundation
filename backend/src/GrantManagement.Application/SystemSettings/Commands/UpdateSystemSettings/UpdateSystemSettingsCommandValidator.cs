using FluentValidation;

namespace GrantManagement.Application.SystemSettings.Commands.UpdateSystemSettings;

public class UpdateSystemSettingsCommandValidator
    : AbstractValidator<UpdateSystemSettingsCommand>
{
    public UpdateSystemSettingsCommandValidator()
    {
        RuleFor(x => x.NotificationWarningDays)
            .InclusiveBetween(1, 90)
            .WithMessage("Az értesítési előfigyelmeztetés 1 és 90 nap között lehet.");

        RuleFor(x => x.SpendingWarningDays)
            .InclusiveBetween(1, 90)
            .WithMessage("A felhasználási előfigyelmeztetés 1 és 90 nap között lehet.");

        RuleFor(x => x.MaxFileSizeMb)
            .InclusiveBetween(1, 500)
            .WithMessage("A maximális fájlméret 1 és 500 MB között lehet.");

        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("A szervezet neve kötelező.")
            .MaximumLength(200).WithMessage("A szervezet neve legfeljebb 200 karakter lehet.");

        RuleFor(x => x.InvitationExpiryHours)
            .InclusiveBetween(1, 168)
            .WithMessage("A meghívó érvényességi ideje 1 és 168 óra között lehet.");
    }
}
