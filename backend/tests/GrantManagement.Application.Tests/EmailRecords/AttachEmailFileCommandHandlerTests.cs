using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.Commands.AttachEmailFile;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.EmailRecords;

public class AttachEmailFileCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly Mock<IFileStorageService> _fileStorageMock = new();
    private readonly Mock<IEmailParser> _emailParserMock = new();
    private readonly AttachEmailFileCommandHandler _sut;

    public AttachEmailFileCommandHandlerTests()
    {
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _fileStorageMock
            .Setup(f => f.SaveFileAsync(
                It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/email.eml");

        _emailParserMock
            .Setup(p => p.Parse(It.IsAny<Stream>()))
            .Returns(new EmlPreviewDto
            {
                From = "sender@example.com",
                Subject = "Teszt e-mail",
                Date = DateTimeOffset.UtcNow,
                Body = "E-mail törzse."
            });

        _sut = new AttachEmailFileCommandHandler(
            _contextMock.Object, _currentUserMock.Object, _fileStorageMock.Object, _emailParserMock.Object);
    }

    [Fact]
    public async Task Handle_WhenEmlFileAttached_ShouldSaveFileAndParsePreview()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var record = CreateEmailRecord(applicationId);

        SetupEmailRecordsMock([record]);
        _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet<AppUser>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var command = new AttachEmailFileCommand
        {
            ApplicationId = applicationId,
            EmailRecordId = record.Id,
            File = new EmailFileUpload(Stream.Null, "email.eml", "message/rfc822", 2048)
        };

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.HasAttachment.Should().BeTrue();
        record.AttachmentFileName.Should().Be("email.eml");
        record.EmlFrom.Should().Be("sender@example.com");
        _fileStorageMock.Verify(f => f.SaveFileAsync(
            It.IsAny<Stream>(), "email.eml", "message/rfc822", It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenInvalidFileType_ShouldThrowDomainException()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var record = CreateEmailRecord(applicationId);
        SetupEmailRecordsMock([record]);

        var command = new AttachEmailFileCommand
        {
            ApplicationId = applicationId,
            EmailRecordId = record.Id,
            File = new EmailFileUpload(Stream.Null, "document.txt", "text/plain", 512)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*eml*");
    }

    [Fact]
    public async Task Handle_WhenEmailRecordNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupEmailRecordsMock([]);

        var command = new AttachEmailFileCommand
        {
            ApplicationId = Guid.NewGuid(),
            EmailRecordId = Guid.NewGuid(),
            File = new EmailFileUpload(Stream.Null, "email.eml", "message/rfc822", 1024)
        };

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // --- helpers ---

    private static EmailRecord CreateEmailRecord(Guid applicationId)
        => EmailRecord.Create(
            applicationId,
            "Teszt tárgy",
            "sender@example.com",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            EmailDirection.In,
            Guid.NewGuid());

    private void SetupEmailRecordsMock(List<EmailRecord> data)
        => _contextMock.Setup(c => c.EmailRecords).Returns(CreateMockDbSet(data).Object);

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
