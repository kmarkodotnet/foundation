using FluentValidation;

namespace GrantManagement.Application.Platform.Users.Commands.InvitePlatformUser;

public sealed class InvitePlatformUserCommandValidator : AbstractValidator<InvitePlatformUserCommand>
{
    public InvitePlatformUserCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Érvényes e-mail cím szükséges.");
    }
}
