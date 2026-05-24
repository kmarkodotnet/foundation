using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.Queries.DownloadAllProofPhotos;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.ProofRecords;

public class DownloadAllProofPhotosQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly DownloadAllProofPhotosQueryHandler _sut;

    public DownloadAllProofPhotosQueryHandlerTests()
    {
        _sut = new DownloadAllProofPhotosQueryHandler(_contextMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_WhenRecordExists_ShouldReturnZipStream()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var record = ProofRecord.Create(applicationId, "Event", DateOnly.FromDateTime(DateTime.UtcNow), Guid.NewGuid());

        SetupRecordsMock([record]);

        var query = new DownloadAllProofPhotosQuery(applicationId, record.Id);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.ContentType.Should().Be("application/zip");
        result.FileName.Should().Contain(record.Id.ToString());
        result.Stream.Should().NotBeNull();
        result.Stream.Position.Should().Be(0);
    }

    [Fact]
    public async Task Handle_WhenRecordNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupRecordsMock([]);

        var query = new DownloadAllProofPhotosQuery(Guid.NewGuid(), Guid.NewGuid());

        // Act
        Func<Task> act = () => _sut.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    private void SetupRecordsMock(List<ProofRecord> data)
        => _contextMock.Setup(c => c.ProofRecords).Returns(CreateMockDbSet(data).Object);

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
