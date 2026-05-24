using FluentAssertions;
using GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;

namespace GrantManagement.Application.Tests.EmailRecords;

public class CreateEmailRecordCommandValidatorTests
{
    private readonly CreateEmailRecordCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenSubjectEmpty_ShouldFail()
    {
        var cmd = new CreateEmailRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            Subject = "",
            SenderEmail = "sender@example.com",
            SentDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Direction = "In"
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Subject) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenSenderEmailInvalid_ShouldFail()
    {
        var cmd = new CreateEmailRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            Subject = "Tárgy",
            SenderEmail = "not-an-email",
            SentDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Direction = "In"
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.SenderEmail) &&
            e.ErrorMessage.Contains("Érvénytelen"));
    }

    [Fact]
    public void Validate_WhenSentDateDefault_ShouldFail()
    {
        var cmd = new CreateEmailRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            Subject = "Tárgy",
            SenderEmail = "sender@example.com",
            SentDate = default,
            Direction = "In"
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.SentDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenDirectionInvalid_ShouldFail()
    {
        var cmd = new CreateEmailRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            Subject = "Tárgy",
            SenderEmail = "sender@example.com",
            SentDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Direction = "InvalidDirection"
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Direction));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPass()
    {
        var cmd = new CreateEmailRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            Subject = "Pályázat eredménye",
            SenderEmail = "palyaztato@example.hu",
            SentDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Direction = "In"
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
