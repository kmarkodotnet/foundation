using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.Queries.GetProofPhoto;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.ProofRecords;

public class GetProofPhotoQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly GetProofPhotoQueryHandler _sut;

    public GetProofPhotoQueryHandlerTests()
    {
        _fileStorageMock
            .Setup(f => f.GetFileAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MemoryStream([1, 2, 3]));

        _sut = new GetProofPhotoQueryHandler(_contextMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_WhenPhotoExistsAndRecordBelongsToApp_ShouldReturnFileResult()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var record = ProofRecord.Create(applicationId, "Event", DateOnly.FromDateTime(DateTime.UtcNow), Guid.NewGuid());
        var photo = ProofPhoto.Create(record.Id, "site.jpg", "uploads/site.jpg", "image/jpeg", 2048);

        SetupPhotosMock([photo]);
        SetupRecordsMock([record]);

        var query = new GetProofPhotoQuery(applicationId, record.Id, photo.Id);

        // Act
        var result = await _sut.Handle(query, CancellationToken.None);

        // Assert
        result.ContentType.Should().Be("image/jpeg");
        result.FileName.Should().Be("site.jpg");
        result.Stream.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WhenPhotoNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupPhotosMock([]);
        SetupRecordsMock([]);

        var query = new GetProofPhotoQuery(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        // Act
        Func<Task> act = () => _sut.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenRecordDoesNotBelongToApp_ShouldThrowNotFoundException()
    {
        // Arrange — photo found but no matching record for this applicationId
        var someRecordId = Guid.NewGuid();
        var photo = ProofPhoto.Create(someRecordId, "site.jpg", "uploads/site.jpg", "image/jpeg", 2048);
        SetupPhotosMock([photo]);
        SetupRecordsMock([]);  // AnyAsync → false

        var query = new GetProofPhotoQuery(Guid.NewGuid(), someRecordId, photo.Id);

        // Act
        Func<Task> act = () => _sut.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    private void SetupPhotosMock(List<ProofPhoto> data)
        => _contextMock.Setup(c => c.ProofPhotos).Returns(CreateMockDbSet(data).Object);

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
