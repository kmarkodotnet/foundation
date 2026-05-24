using AutoMapper;
using FluentAssertions;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.Commands.CreateGranter;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Application.Tests.Common;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace GrantManagement.Application.Tests.Granters;

public class CreateGranterCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly CreateGranterCommandHandler _sut;

    public CreateGranterCommandHandlerTests()
    {
        _sut = new CreateGranterCommandHandler(_contextMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task Handle_WhenNameIsUnique_ShouldCreateAndReturnGranterDto()
    {
        // Arrange
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet<Granter>([]).Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var expectedDto = new GranterDto { Id = Guid.NewGuid(), Name = "Nemzeti Alap", Status = "Active" };
        _mapperMock.Setup(m => m.Map<GranterDto>(It.IsAny<Granter>())).Returns(expectedDto);

        var command = new CreateGranterCommand("Nemzeti Alap", "Leírás", null, "info@national.hu");

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        result.Should().Be(expectedDto);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mapperMock.Verify(m => m.Map<GranterDto>(It.IsAny<Granter>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenNameAlreadyExists_ShouldThrowDomainException()
    {
        // Arrange
        var existing = Granter.Create("Nemzeti Alap", null, ContactInfo.Empty);
        _contextMock.Setup(c => c.Granters).Returns(CreateMockDbSet([existing]).Object);

        var command = new CreateGranterCommand("Nemzeti Alap", null, null, null);

        // Act
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*pályáztató*");
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
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
