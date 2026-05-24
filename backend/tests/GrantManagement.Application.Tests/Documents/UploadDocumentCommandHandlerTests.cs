using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.Commands.UploadDocument;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Documents;

public class UploadDocumentCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly UploadDocumentCommandHandler _sut;

    public UploadDocumentCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _fileStorageMock
            .Setup(f => f.SaveFileAsync(
                It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/document.pdf");

        _sut = new UploadDocumentCommandHandler(
            _contextMock.Object, _currentUserMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_WhenValidFile_ShouldCreateDocumentAndReturnDto()
    {
        // Arrange
        var app = CreateWonApplication();
        SetupApplicationsMock([app]);
        _contextMock.Setup(c => c.Documents).Returns(CreateMockDbSet<Document>([]).Object);
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet<AppUser>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UploadDocumentCommand
        {
            ApplicationId = app.Id,
            DocumentType = DocumentType.ContractDocument,
            File = new DocumentUpload(Stream.Null, "contract.pdf", "application/pdf", 4096)
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.FileName.Should().Be("contract.pdf");
        result.ContentType.Should().Be("application/pdf");
        result.FileSizeBytes.Should().Be(4096);
        result.IsArchived.Should().BeFalse();
        result.UploadedByName.Should().Be("Ismeretlen");
        _fileStorageMock.Verify(f => f.SaveFileAsync(
            It.IsAny<Stream>(), "contract.pdf", "application/pdf", It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUnsupportedMimeType_ShouldThrowDomainException()
    {
        // Arrange
        var app = CreateWonApplication();
        SetupApplicationsMock([app]);

        var command = new UploadDocumentCommand
        {
            ApplicationId = app.Id,
            DocumentType = DocumentType.Other,
            File = new DocumentUpload(Stream.Null, "script.exe", "application/octet-stream", 1024)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*fájlformátum*");
    }

    [Fact]
    public async Task Handle_WhenFileTooLarge_ShouldThrowDomainException()
    {
        // Arrange
        var app = CreateWonApplication();
        SetupApplicationsMock([app]);

        const long sixtyMb = 60L * 1024 * 1024;
        var command = new UploadDocumentCommand
        {
            ApplicationId = app.Id,
            DocumentType = DocumentType.Other,
            File = new DocumentUpload(Stream.Null, "large.pdf", "application/pdf", sixtyMb)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*mérete*");
    }

    [Fact]
    public async Task Handle_WhenAppNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new UploadDocumentCommand
        {
            ApplicationId = Guid.NewGuid(),
            DocumentType = DocumentType.Other,
            File = new DocumentUpload(Stream.Null, "doc.pdf", "application/pdf", 1024)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // --- helpers ---

    private static GrantApp CreateWonApplication()
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var byUserId = Guid.NewGuid();
        var app = GrantApp.Create("Nyertes Pályázat", Guid.NewGuid(), callData, byUserId);
        var submissionData = new SubmissionStepData
        {
            SubmittedAt = DateTimeOffset.UtcNow.AddDays(-3),
            SubmittedByUserId = byUserId
        };
        app.RecordSubmission(submissionData, byUserId);
        app.ApproveSubmission(byUserId);
        app.RecordResult(ApplicationResult.Won(
            DateOnly.FromDateTime(DateTime.UtcNow),
            new Money(2_000_000m, "HUF"), null), byUserId);
        return app;
    }

    private void SetupApplicationsMock(List<GrantApp> data)
        => _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);

    private static Mock<DbSet<T>> CreateMockDbSet<T>(List<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mock = new Mock<DbSet<T>>();
        mock.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(data.GetEnumerator()));
        mock.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<T>(queryable.Provider));
        mock.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mock.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mock.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());
        return mock;
    }
}
