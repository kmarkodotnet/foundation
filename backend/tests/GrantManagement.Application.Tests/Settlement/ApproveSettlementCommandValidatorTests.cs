using FluentAssertions;
using GrantManagement.Application.Settlement.Commands.ApproveSettlement;

namespace GrantManagement.Application.Tests.Settlement;

public class ApproveSettlementCommandValidatorTests
{
    private readonly ApproveSettlementCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenRejectedWithoutNote_ShouldFail()
    {
        var cmd = new ApproveSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            IsApproved = false,
            RejectionNote = null
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.RejectionNote) &&
            e.ErrorMessage.Contains("okát"));
    }

    [Fact]
    public void Validate_WhenRejectedWithNote_ShouldPass()
    {
        var cmd = new ApproveSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            IsApproved = false,
            RejectionNote = "Hiányos dokumentáció."
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenApprovedWithoutNote_ShouldPass()
    {
        var cmd = new ApproveSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            IsApproved = true,
            RejectionNote = null
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
