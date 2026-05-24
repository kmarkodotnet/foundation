using FluentAssertions;
using GrantManagement.Application.Workflow.Commands.UpdateSubmissionStep;

namespace GrantManagement.Application.Tests.Workflow;

public class UpdateSubmissionStepCommandValidatorTests
{
    private readonly UpdateSubmissionStepCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenSubmittedAtIsDefault_ShouldFail()
    {
        var cmd = ValidCommand() with { SubmittedAt = default };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.SubmittedAt));
    }

    [Fact]
    public void Validate_WhenSubmittedAtIsInFuture_ShouldFail()
    {
        var cmd = ValidCommand() with { SubmittedAt = DateTimeOffset.UtcNow.AddHours(1) };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.SubmittedAt) &&
            e.ErrorMessage.Contains("jövőbeli"));
    }

    [Fact]
    public void Validate_WhenSubmittedAtIsInPast_ShouldPass()
    {
        var cmd = ValidCommand() with { SubmittedAt = DateTimeOffset.UtcNow.AddHours(-1) };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenSubmittedAtIsNow_ShouldPass()
    {
        var cmd = ValidCommand() with { SubmittedAt = DateTimeOffset.UtcNow.AddSeconds(-1) };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    private static UpdateSubmissionStepCommand ValidCommand() => new(
        ApplicationId: Guid.NewGuid(),
        SubmittedAt: DateTimeOffset.UtcNow.AddHours(-2),
        SubmissionMethodId: null,
        ExternalIdentifier: null,
        Notes: null);
}
