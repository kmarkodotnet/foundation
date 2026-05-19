using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using GrantManagement.Application.Common.Behaviours;
using MediatR;

namespace GrantManagement.Application.Tests.Common;

// --- Test stubs ---

file sealed record TestCommand(string? Name) : IRequest<Unit>;

file sealed class TestCommandValidator : AbstractValidator<TestCommand>
{
    public TestCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("A név megadása kötelező.");
    }
}

// -------------------------

public class ValidationBehaviourTests
{
    private static Task<Unit> Next() => Task.FromResult(Unit.Value);

    [Fact]
    public async Task Handle_WhenNoValidators_ShouldCallNext()
    {
        // Arrange
        var behaviour = new ValidationBehaviour<TestCommand, Unit>(
            Enumerable.Empty<IValidator<TestCommand>>());

        var nextCalled = false;
        Task<Unit> TrackedNext() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act
        var result = await behaviour.Handle(
            new TestCommand("any"),
            TrackedNext,
            CancellationToken.None);

        // Assert
        nextCalled.Should().BeTrue();
        result.Should().Be(Unit.Value);
    }

    [Fact]
    public async Task Handle_WhenValidatorFails_ShouldThrowValidationException()
    {
        // Arrange
        var validators = new List<IValidator<TestCommand>> { new TestCommandValidator() };
        var behaviour = new ValidationBehaviour<TestCommand, Unit>(validators);

        var nextCalled = false;
        Task<Unit> TrackedNext() { nextCalled = true; return Task.FromResult(Unit.Value); }

        // Act - pass null Name to trigger validation failure
        Func<Task> act = () => behaviour.Handle(
            new TestCommand(null),
            TrackedNext,
            CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*A név megadása kötelező*");

        nextCalled.Should().BeFalse();
    }
}
