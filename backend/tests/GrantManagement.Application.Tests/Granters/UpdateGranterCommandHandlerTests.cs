using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.Commands.UpdateGranter;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Granters;

public class UpdateGranterCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly UpdateGranterCommandHandler _sut;

    public UpdateGranterCommandHandlerTests()
    {
        _sut = new UpdateGranterCommandHandler(_contextMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task Handle_WhenValidUpdate_ShouldUpdateAndReturnGranterDto()
    {
        // Arrange
        var granter = Granter.Create("Eredeti Név", "Régi leírás", ContactInfo.Empty);
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet([granter]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var expectedDto = new GranterDto { Id = granter.Id, Name = "Új Név", Status = "Active" };
        _mapperMock.Setup(m => m.Map<GranterDto>(It.IsAny<Granter>())).Returns(expectedDto);

        var command = new UpdateGranterCommand(granter.Id, "Új Név", "Új leírás", null, null);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().Be(expectedDto);
        granter.Name.Should().Be("Új Név");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenNameConflictsWithAnotherGranter_ShouldThrowDomainException()
    {
        // Arrange
        var granter = Granter.Create("Eredeti Név", null, ContactInfo.Empty);
        var otherGranter = Granter.Create("Ütköző Név", null, ContactInfo.Empty);
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet([granter, otherGranter]).Object);

        var command = new UpdateGranterCommand(granter.Id, "Ütköző Név", null, null, null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*pályáztató*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenGranterNotFound_ShouldThrowNotFoundException()
    {
        // Arrange
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet<Granter>([]).Object);

        var command = new UpdateGranterCommand(Guid.NewGuid(), "Bármi", null, null, null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
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
