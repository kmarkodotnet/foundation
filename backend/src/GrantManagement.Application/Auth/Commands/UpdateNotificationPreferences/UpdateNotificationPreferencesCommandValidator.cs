using FluentValidation;

namespace GrantManagement.Application.Auth.Commands.UpdateNotificationPreferences;

public class UpdateNotificationPreferencesCommandValidator
    : AbstractValidator<UpdateNotificationPreferencesCommand>
{
    public UpdateNotificationPreferencesCommandValidator() { }
}
