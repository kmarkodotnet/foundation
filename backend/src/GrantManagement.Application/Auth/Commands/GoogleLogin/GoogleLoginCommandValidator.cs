using FluentValidation;

namespace GrantManagement.Application.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator()
    {
        RuleFor(x => x.AuthorizationCode)
            .NotEmpty()
            .WithMessage("Authorization code is required.");

        RuleFor(x => x.RedirectUri)
            .NotEmpty()
            .WithMessage("Redirect URI is required.");
    }
}
