using FluentAssertions;
using GrantManagement.Application.Documents.Commands.UploadDocument;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Tests.Documents;

public class UploadDocumentCommandValidatorTests
{
    private readonly UploadDocumentCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenFileNull_ShouldFail()
    {
        var cmd = new UploadDocumentCommand
        {
            ApplicationId = Guid.NewGuid(),
            DocumentType = DocumentType.ContractDocument,
            File = null!
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.File) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenDocumentTypeInvalid_ShouldFail()
    {
        var cmd = new UploadDocumentCommand
        {
            ApplicationId = Guid.NewGuid(),
            DocumentType = (DocumentType)999,
            File = new DocumentUpload(Stream.Null, "doc.pdf", "application/pdf", 1024)
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.DocumentType));
    }

    [Fact]
    public void Validate_WhenDisplayNameTooLong_ShouldFail()
    {
        var cmd = new UploadDocumentCommand
        {
            ApplicationId = Guid.NewGuid(),
            DocumentType = DocumentType.Other,
            DisplayName = new string('x', 256),
            File = new DocumentUpload(Stream.Null, "doc.pdf", "application/pdf", 1024)
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.DisplayName));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPass()
    {
        var cmd = new UploadDocumentCommand
        {
            ApplicationId = Guid.NewGuid(),
            DocumentType = DocumentType.ContractDocument,
            DisplayName = "Szerződés 2026",
            File = new DocumentUpload(Stream.Null, "contract.pdf", "application/pdf", 4096)
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
