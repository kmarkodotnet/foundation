using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.Queries.DownloadDocument;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Documents;

public class DownloadDocumentQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly DownloadDocumentQueryHandler _sut;

    public DownloadDocumentQueryHandlerTests()
    {
        _fileStorageMock
            .Setup(f => f.GetFileAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MemoryStream([1, 2, 3]));

        _sut = new DownloadDocumentQueryHandler(_contextMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_WhenDocumentExistsForApplication_ShouldReturnFileResult()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var step = WorkflowStep.Create(applicationId, WorkflowStepType.Contract, 4, isSkippable: true);
        var doc = Document.Create(step.Id, DocumentType.ContractDocument, "contract.pdf",
            "uploads/contract.pdf", 4096, "application/pdf", Guid.NewGuid());

        SetupDocumentsMock([doc]);
        SetupWorkflowStepsMock([step]);

        var query = new DownloadDocumentQuery(applicationId, doc.Id);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.ContentType.Should().Be("application/pdf");
        result.FileName.Should().Be("contract.pdf");
        result.Stream.Should().NotBeNull();
        _fileStorageMock.Verify(
            f => f.GetFileAsync("uploads/contract.pdf", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenDocumentNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupDocumentsMock([]);
        SetupWorkflowStepsMock([]);

        var query = new DownloadDocumentQuery(Guid.NewGuid(), Guid.NewGuid());

        // Act
        Func<Task> act = () => _sut.Handle(query, CancellationToken.None);

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
