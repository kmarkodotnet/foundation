using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.Commands.UploadDocumentVersion;
using GrantManagement.Application.Documents.DTOs;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Documents;

public class UploadDocumentVersionCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly UploadDocumentVersionCommandHandler _sut;

    public UploadDocumentVersionCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _fileStorageMock
            .Setup(f => f.SaveFileAsync(
                It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/v2.pdf");

        _sut = new UploadDocumentVersionCommandHandler(
            _contextMock.Object, _currentUserMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_WhenParentDocumentExists_ShouldArchiveParentAndReturnIncrementedVersion()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var step = WorkflowStep.Create(applicationId, WorkflowStepType.Contract, 4, isSkippable: true);
        var parent = Document.Create(step.Id, DocumentType.ContractDocument, "v1.pdf",
            "uploads/v1.pdf", 4096, "application/pdf", Guid.NewGuid());

        SetupDocumentsMock([parent]);
        SetupWorkflowStepsMock([step]);
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet<AppUser>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new UploadDocumentVersionCommand
        {
            ApplicationId = applicationId,
            DocumentId = parent.Id,
            File = new DocumentUpload(Stream.Null, "v2.pdf", "application/pdf", 8192)
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert — parent archived
        parent.IsArchived.Should().BeTrue();
        // New version number
        result.Version.Should().Be(2);
        result.FileName.Should().Be("v2.pdf");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenParentNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupDocumentsMock([]);
        SetupWorkflowStepsMock([]);

        var command = new UploadDocumentVersionCommand
        {
            ApplicationId = Guid.NewGuid(),
            DocumentId = Guid.NewGuid(),
            File = new DocumentUpload(Stream.Null, "v2.pdf", "application/pdf", 4096)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    private void SetupDocumentsMock(List<Document> data)
        => _contextMock.Setup(c => c.Documents).Returns(CreateMockDbSet(data).Object);

    private void SetupWorkflowStepsMock(List<WorkflowStep> data)
        => _contextMock.Setup(c => c.WorkflowSteps).Returns(CreateMockDbSet(data).Object);

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
