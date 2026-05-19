using FluentAssertions;
using FluentValidation;
using GrantManagement.Application.Auth.Commands.GoogleLogin;

namespace GrantManagement.Application.Tests.Auth;

public class GoogleLoginCommandValidatorTests
{
    private readonly GoogleLoginCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenAuthorizationCodeIsEmpty_ShouldHaveValidationError()
    {
        var command = new GoogleLoginCommand(string.Empty, "https://example.com/callback");

        var result = _sut.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(GoogleLoginCommand.AuthorizationCode) &&
            e.ErrorMessage == "Authorization code is required.");
    }

    [Fact]
    public void Validate_WhenRedirectUriIsEmpty_ShouldHaveValidationError()
    {
        var command = new GoogleLoginCommand("valid-code", string.Empty);

        var result = _sut.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(GoogleLoginCommand.RedirectUri) &&
            e.ErrorMessage == "Redirect URI is required.");
    }

    [Fact]
    public void Validate_WhenBothFieldsAreEmpty_ShouldHaveTwoValidationErrors()
    {
        var command = new GoogleLoginCommand(string.Empty, string.Empty);

        var result = _sut.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(2);
        result.Errors.Should().Contain(e => e.PropertyName == nameof(GoogleLoginCommand.AuthorizationCode));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(GoogleLoginCommand.RedirectUri));
    }

    [Fact]
    public void Validate_WhenBothFieldsAreProvided_ShouldPassValidation()
    {
        var command = new GoogleLoginCommand("auth-code-123", "https://example.com/callback");

        var result = _sut.Validate(command);

        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }
}
