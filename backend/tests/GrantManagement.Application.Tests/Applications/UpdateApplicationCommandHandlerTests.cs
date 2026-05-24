using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Applications.Commands.UpdateApplication;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Mappings;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Applications;

public class UpdateApplicationCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly IMapper _mapper;
    private readonly UpdateApplicationCommandHandler _sut;

    public UpdateApplicationCommandHandlerTests()
    {
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _sut = new UpdateApplicationCommandHandler(_contextMock.Object, _mapper);
    }

    [Fact]
    public async Task Handle_WhenApplicationExists_ShouldUpdateTitleAndCallData()
    {
        // Arrange
        var granter = Granter.Create("Test Alapítvány", null, ContactInfo.Empty);
        var application = CreateDraftApplication(granter.Id);
        var command = new UpdateApplicationCommand(
            ApplicationId: application.Id,
            Title: "Frissített cím",
            Identifier: "ID-001",
            Description: "Leírás",
            SubmissionDeadline: DateTimeOffset.UtcNow.AddDays(60),
            MinAmount: 100_000m,
            MaxAmount: 500_000m,
            SpendingDeadline: null,
            ApplicationTypeId: null,
            OtherMetadata: null);

        SetupApplicationsMock([application]);
        SetupGrantersMock([granter]);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Frissített cím");
        result.GranterName.Should().Be("Test Alapítvány");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var command = new UpdateApplicationCommand(
            ApplicationId: Guid.NewGuid(),
            Title: "Cím",
            Identifier: null,
            Description: null,
            SubmissionDeadline: DateTimeOffset.UtcNow.AddDays(30),
            MinAmount: null,
            MaxAmount: null,
            SpendingDeadline: null,
            ApplicationTypeId: null,
            OtherMetadata: null);

        SetupApplicationsMock([]);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // --- helpers ---

    private static GrantApp CreateDraftApplication(Guid granterId)
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        return GrantApp.Create("Eredeti cím", granterId, callData, Guid.NewGuid());
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        var mock = CreateMockDbSet(data);
        _contextMock.Setup(c => c.Applications).Returns(mock.Object);
    }

    private void SetupGrantersMock(List<Granter> data)
    {
        var mock = CreateMockDbSet(data);
        _contextMock.Setup(c => c.Granters).Returns(mock.Object);
    }

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
