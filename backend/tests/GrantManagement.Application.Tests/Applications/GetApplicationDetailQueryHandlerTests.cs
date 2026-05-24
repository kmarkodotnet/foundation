using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Applications.Queries.GetApplicationDetail;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Mappings;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.Tests.Applications;

public class GetApplicationDetailQueryHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly IMapper _mapper;
    private readonly GetApplicationDetailQueryHandler _sut;

    public GetApplicationDetailQueryHandlerTests()
    {
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _sut = new GetApplicationDetailQueryHandler(_contextMock.Object, _mapper);
    }

    [Fact]
    public async Task Handle_WhenApplicationExists_ShouldReturnApplicationDetailDto()
    {
        // Arrange
        var granter = Granter.Create("Emberi Erőforrások", null, ContactInfo.Empty);
        var application = CreateDraftApplication(granter.Id);

        SetupApplicationsMock([application]);
        SetupGrantersMock([granter]);

        // Act
        var result = await _sut.Handle(new GetApplicationDetailQuery(application.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(application.Id);
        result.Title.Should().Be("Test Pályázat");
        result.Status.Should().Be(ApplicationStatus.Draft);
        result.GranterName.Should().Be("Emberi Erőforrások");
    }

    [Fact]
    public async Task Handle_WhenApplicationExists_ShouldReturnAllNineWorkflowSteps()
    {
        // Arrange
        var granter = Granter.Create("Test Alapítvány", null, ContactInfo.Empty);
        var application = CreateDraftApplication(granter.Id);

        SetupApplicationsMock([application]);
        SetupGrantersMock([granter]);

        // Act
        var result = await _sut.Handle(new GetApplicationDetailQuery(application.Id), CancellationToken.None);

        // Assert
        result.WorkflowSteps.Should().HaveCount(9);
        result.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Call && s.Status == WorkflowStepStatus.Completed);
        result.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Submission && s.Status == WorkflowStepStatus.Active);
    }

    [Fact]
    public async Task Handle_WhenGranterNotFound_ShouldReturnEmptyGranterName()
    {
        // Arrange
        var application = CreateDraftApplication(Guid.NewGuid());
        SetupApplicationsMock([application]);
        SetupGrantersMock([]); // no granter

        // Act
        var result = await _sut.Handle(new GetApplicationDetailQuery(application.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.GranterName.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhenApplicationNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        SetupApplicationsMock([]);
        SetupGrantersMock([]);

        // Act
        Func<Task> act = () => _sut.Handle(new GetApplicationDetailQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // --- helpers ---

    private static GrantApp CreateDraftApplication(Guid granterId)
    {
        var callData = new CallStepData { SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(30) };
        return GrantApp.Create("Test Pályázat", granterId, callData, Guid.NewGuid());
    }

    private void SetupApplicationsMock(List<GrantApp> data)
    {
        _contextMock.Setup(c => c.Applications).Returns(CreateMockDbSet(data).Object);
    }

    private void SetupGrantersMock(List<Granter> data)
    {
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet(data).Object);
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
