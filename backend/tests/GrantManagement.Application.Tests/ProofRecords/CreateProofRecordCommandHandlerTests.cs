using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.Commands.CreateProofRecord;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.ProofRecords;

public class CreateProofRecordCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly CreateProofRecordCommandHandler _sut;

    public CreateProofRecordCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _fileStorageMock
            .Setup(f => f.SaveFileAsync(
                It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/photo.jpg");

        _sut = new CreateProofRecordCommandHandler(
            _contextMock.Object, _currentUserMock.Object, _fileStorageMock.Object);
    }

    [Fact]
    public async Task Handle_WhenWonAppWithPhoto_ShouldCreateRecordAndUploadPhoto()
    {
        // Arrange
        var app = CreateWonApplication();
        SetupApplicationsMock([app]);
        _contextMock.Setup(c => c.ProofRecords).Returns(CreateMockDbSet<ProofRecord>([]).Object);
        _contextMock.Setup(c => c.ProofPhotos).Returns(CreateMockDbSet<ProofPhoto>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new CreateProofRecordCommand
        {
            ApplicationId = app.Id,
            ProofType = "Event",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            Photos = [new PhotoUpload(Stream.Null, "site.jpg", "image/jpeg", 2048)]
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.ApplicationId.Should().Be(app.Id);
        result.ProofType.Should().Be("Event");
        result.Photos.Should().HaveCount(1);
        result.Photos[0].FileName.Should().Be("site.jpg");
        result.Photos[0].ContentType.Should().Be("image/jpeg");
        _fileStorageMock.Verify(f => f.SaveFileAsync(
            It.IsAny<Stream>(), "site.jpg", "image/jpeg", It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenAppNotWon_ShouldThrowDomainException()
    {
        // Arrange — application in initial (Call) state, not Won
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        var app = GrantApp.Create("Pályázat", Guid.NewGuid(), callData, Guid.NewGuid());
        SetupApplicationsMock([app]);

        var command = new CreateProofRecordCommand
        {
            ApplicationId = app.Id,
            ProofType = "Event",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Photos = [new PhotoUpload(Stream.Null, "photo.jpg", "image/jpeg", 1024)]
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*nyert*");
    }

    [Fact]
    public async Task Handle_WhenAppNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);

        var command = new CreateProofRecordCommand
        {
            ApplicationId = Guid.NewGuid(),
            ProofType = "Event",
            EventDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Photos = [new PhotoUpload(Stream.Null, "photo.jpg", "image/jpeg", 1024)]
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
