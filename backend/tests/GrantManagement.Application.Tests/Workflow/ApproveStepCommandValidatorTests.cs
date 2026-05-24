using FluentAssertions;
using GrantManagement.Application.Workflow.Commands.ApproveStep;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Tests.Workflow;

public class ApproveStepCommandValidatorTests
{
    private readonly ApproveStepCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenRejectedWithoutNote_ShouldFail()
    {
        var cmd = new ApproveStepCommand(
            ApplicationId: Guid.NewGuid(),
            StepType: WorkflowStepType.Submission,
            IsApproved: false,
            RejectionNote: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.RejectionNote) &&
            e.ErrorMessage.Contains("okát"));
    }

    [Fact]
    public void Validate_WhenRejectedWithEmptyNote_ShouldFail()
    {
        var cmd = new ApproveStepCommand(
            ApplicationId: Guid.NewGuid(),
            StepType: WorkflowStepType.Submission,
            IsApproved: false,
            RejectionNote: "");

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(cmd.RejectionNote));
    }

    [Fact]
    public void Validate_WhenRejectedWithNote_ShouldPass()
    {
        var cmd = new ApproveStepCommand(
            ApplicationId: Guid.NewGuid(),
            StepType: WorkflowStepType.Submission,
            IsApproved: false,
            RejectionNote: "Hiányos dokumentáció.");

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenApprovedWithoutNote_ShouldPass()
    {
        var cmd = new ApproveStepCommand(
            ApplicationId: Guid.NewGuid(),
            StepType: WorkflowStepType.Submission,
            IsApproved: true,
            RejectionNote: null);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
