using FluentAssertions;
using GrantManagement.Application.Settlement.Commands.RecordSettlement;

namespace GrantManagement.Application.Tests.Settlement;

public class RecordSettlementCommandValidatorTests
{
    private readonly RecordSettlementCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenSettlementDateDefault_ShouldFail()
    {
        var cmd = new RecordSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            SettlementDate = default
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.SettlementDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenDescriptionTooLong_ShouldFail()
    {
        var cmd = new RecordSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Description = new string('x', 2001)
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Description));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPass()
    {
        var cmd = new RecordSettlementCommand
        {
            ApplicationId = Guid.NewGuid(),
            SettlementDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Description = "Összefoglaló",
            Notes = null
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
