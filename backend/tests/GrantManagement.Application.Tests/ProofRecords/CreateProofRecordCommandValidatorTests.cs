using FluentAssertions;
using GrantManagement.Application.ProofRecords.Commands.CreateProofRecord;
using GrantManagement.Application.ProofRecords.DTOs;

namespace GrantManagement.Application.Tests.ProofRecords;

public class CreateProofRecordCommandValidatorTests
{
    private readonly CreateProofRecordCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenPhotosEmpty_ShouldFail()
    {
        var cmd = new CreateProofRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            ProofType = "Event",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Photos = []
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Photos) &&
            e.ErrorMessage.Contains("fotó"));
    }

    [Fact]
    public void Validate_WhenProofTypeEmpty_ShouldFail()
    {
        var cmd = new CreateProofRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            ProofType = "",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Photos = [new PhotoUpload(Stream.Null, "photo.jpg", "image/jpeg", 1024)]
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.ProofType) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenProofTypeInvalid_ShouldFail()
    {
        var cmd = new CreateProofRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            ProofType = "InvalidType",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Photos = [new PhotoUpload(Stream.Null, "photo.jpg", "image/jpeg", 1024)]
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.ProofType) &&
            e.ErrorMessage.Contains("Érvénytelen"));
    }

    [Fact]
    public void Validate_WhenEventDateDefault_ShouldFail()
    {
        var cmd = new CreateProofRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            ProofType = "Event",
            EventDate = default,
            Photos = [new PhotoUpload(Stream.Null, "photo.jpg", "image/jpeg", 1024)]
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.EventDate) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPass()
    {
        var cmd = new CreateProofRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            ProofType = "Event",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Photos = [new PhotoUpload(Stream.Null, "photo.jpg", "image/jpeg", 1024)]
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
