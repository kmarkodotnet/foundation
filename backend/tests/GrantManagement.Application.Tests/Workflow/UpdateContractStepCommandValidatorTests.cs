using FluentAssertions;
using GrantManagement.Application.Workflow.Commands.UpdateContractStep;

namespace GrantManagement.Application.Tests.Workflow;

public class UpdateContractStepCommandValidatorTests
{
    private readonly UpdateContractStepCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenNotificationReceivedButNoDate_ShouldFail()
    {
        var cmd = new UpdateContractStepCommand(
            ApplicationId: Guid.NewGuid(),
            ContractIdentifier: "SZERZ-001",
            ContractDate: DateOnly.FromDateTime(DateTime.UtcNow),
            NotificationReceived: true,
            NotificationDate: null,
            Complete: false);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.NotificationDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenNotificationReceivedWithDate_ShouldPass()
    {
        var cmd = new UpdateContractStepCommand(
            ApplicationId: Guid.NewGuid(),
            ContractIdentifier: "SZERZ-001",
            ContractDate: DateOnly.FromDateTime(DateTime.UtcNow),
            NotificationReceived: true,
            NotificationDate: DateOnly.FromDateTime(DateTime.UtcNow),
            Complete: false);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenNotificationNotReceivedAndNoDate_ShouldPass()
    {
        var cmd = new UpdateContractStepCommand(
            ApplicationId: Guid.NewGuid(),
            ContractIdentifier: null,
            ContractDate: null,
            NotificationReceived: false,
            NotificationDate: null,
            Complete: false);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
