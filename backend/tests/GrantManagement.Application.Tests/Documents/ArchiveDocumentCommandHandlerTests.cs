using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Documents.Commands.ArchiveDocument;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Documents;

public class ArchiveDocumentCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly ArchiveDocumentCommandHandler _sut;

    public ArchiveDocumentCommandHandlerTests()
    {
        _sut = new ArchiveDocumentCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_WhenDocumentExists_ShouldSetIsArchivedAndSave()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var step = WorkflowStep.Create(applicationId, WorkflowStepType.Contract, 4, isSkippable: true);
        var doc = Document.Create(step.Id, DocumentType.ContractDocument, "contract.pdf",
            "uploads/contract.pdf", 4096, "application/pdf", Guid.NewGuid());

        SetupDocumentsMock([doc]);
        SetupWorkflowStepsMock([step]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new ArchiveDocumentCommand(applicationId, doc.Id);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        doc.IsArchived.Should().BeTrue();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenDocumentNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupDocumentsMock([]);
        SetupWorkflowStepsMock([]);

        var command = new ArchiveDocumentCommand(Guid.NewGuid(), Guid.NewGuid());

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
