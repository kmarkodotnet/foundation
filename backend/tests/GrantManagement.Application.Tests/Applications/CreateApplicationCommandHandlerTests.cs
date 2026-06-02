using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Applications.Commands.CreateApplication;
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

public class CreateApplicationCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<ICurrentUserService> _currentUserMock = new();
    private readonly IMapper _mapper;
    private readonly CreateApplicationCommandHandler _sut;

    public CreateApplicationCommandHandlerTests()
    {
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());

        _sut = new CreateApplicationCommandHandler(
            _contextMock.Object,
            _currentUserMock.Object,
            _mapper);
    }

    [Fact]
    public async Task Handle_WhenGranterExistsAndActive_ShouldCreateApplicationWithDraftStatus()
    {
        // Arrange
        var granter = CreateActiveGranter();
        var command = ValidCommand(granter.Id);

        SetupGrantersMock([granter]);
        SetupAppUsersMock([]);
        SetupCodeListItemsMock([]);
        GrantApp? capturedApp = null;
        var appsMock = CreateMockDbSet<GrantApp>([]);
        appsMock.Setup(d => d.Add(It.IsAny<GrantApp>()))
                .Callback<GrantApp>(a => capturedApp = a);
        _contextMock.Setup(c => c.Applications).Returns(appsMock.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(ApplicationStatus.Draft);
        result.Title.Should().Be(command.Title);
        result.GranterId.Should().Be(granter.Id);

        capturedApp.Should().NotBeNull();
        capturedApp!.Status.Should().Be(ApplicationStatus.Draft);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenGranterExistsAndActive_ShouldGenerateNineWorkflowSteps()
    {
        // Arrange
        var granter = CreateActiveGranter();
        var command = ValidCommand(granter.Id);

        SetupGrantersMock([granter]);
        SetupAppUsersMock([]);
        SetupCodeListItemsMock([]);
        GrantApp? capturedApp = null;
        var appsMock = CreateMockDbSet<GrantApp>([]);
        appsMock.Setup(d => d.Add(It.IsAny<GrantApp>()))
                .Callback<GrantApp>(a => capturedApp = a);
        _contextMock.Setup(c => c.Applications).Returns(appsMock.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        await _sut.Handle(command, CancellationToken.None);

        // Assert
        capturedApp!.WorkflowSteps.Should().HaveCount(9);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Call && s.Status == WorkflowStepStatus.Completed);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Submission && s.Status == WorkflowStepStatus.Active);
        capturedApp.WorkflowSteps
            .Where(s => s.StepType != WorkflowStepType.Call && s.StepType != WorkflowStepType.Submission)
            .Should().AllSatisfy(s => s.Status.Should().Be(WorkflowStepStatus.Pending));
    }

    [Fact]
    public async Task Handle_WhenIsSkippableSteps_ShouldBeMarkedCorrectly()
    {
        // Arrange
        var granter = CreateActiveGranter();
        SetupGrantersMock([granter]);
        SetupAppUsersMock([]);
        SetupCodeListItemsMock([]);
        GrantApp? capturedApp = null;
        var appsMock = CreateMockDbSet<GrantApp>([]);
        appsMock.Setup(d => d.Add(It.IsAny<GrantApp>()))
                .Callback<GrantApp>(a => capturedApp = a);
        _contextMock.Setup(c => c.Applications).Returns(appsMock.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        await _sut.Handle(ValidCommand(granter.Id), CancellationToken.None);

        // Assert
        capturedApp!.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Contract && s.IsSkippable);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.VendorContracts && s.IsSkippable);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Proof && s.IsSkippable);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Call && !s.IsSkippable);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Submission && !s.IsSkippable);
        capturedApp.WorkflowSteps.Should()
            .Contain(s => s.StepType == WorkflowStepType.Settlement && !s.IsSkippable);
    }

    [Fact]
    public async Task Handle_WhenGranterNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        var command = ValidCommand(Guid.NewGuid());
        SetupGrantersMock([]); // empty

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenGranterIsInactive_ShouldThrowDomainException()
    {
        // Arrange
        var granter = CreateActiveGranter();
        granter.Deactivate();
        var command = ValidCommand(granter.Id);
        SetupGrantersMock([granter]);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*Inaktív*");
    }

    // --- helpers ---

    private static Granter CreateActiveGranter() =>
        Granter.Create("Test Alapítvány", null, ContactInfo.Empty);

    private static CreateApplicationCommand ValidCommand(Guid granterId) => new(
        Title: "Oktatási pályázat 2025",
        GranterId: granterId,
        SubmissionDeadline: DateTimeOffset.UtcNow.AddDays(30));

    private void SetupGrantersMock(List<Granter> data)
    {
        var mock = CreateMockDbSet(data);
        _contextMock.Setup(c => c.Granters).Returns(mock.Object);
    }

    private void SetupAppUsersMock(List<AppUser> data)
        => _contextMock.Setup(c => c.AppUsers).Returns(CreateMockDbSet(data).Object);

    private void SetupCodeListItemsMock(List<CodeListItem> data)
        => _contextMock.Setup(c => c.CodeListItems).Returns(CreateMockDbSet(data).Object);

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
