using FluentValidation;

namespace GrantManagement.Application.Platform.Settings.Commands.UpdatePlatformSettings;

public sealed class UpdatePlatformSettingsCommandValidator : AbstractValidator<UpdatePlatformSettingsCommand>
{
    public UpdatePlatformSettingsCommandValidator()
    {
        When(x => x.MaxFileSizeMb.HasValue, () =>
            RuleFor(x => x.MaxFileSizeMb!.Value).GreaterThan(0).LessThanOrEqualTo(500));
        When(x => x.InvitationExpiryHours.HasValue, () =>
            RuleFor(x => x.InvitationExpiryHours!.Value).GreaterThan(0).LessThanOrEqualTo(8760));
        When(x => x.DefaultDeadlineNotificationDays.HasValue, () =>
            RuleFor(x => x.DefaultDeadlineNotificationDays!.Value).GreaterThan(0).LessThanOrEqualTo(365));
    }
}
