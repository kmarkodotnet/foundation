using FluentAssertions;
using GrantManagement.Application.Comments.Commands.AddComment;

namespace GrantManagement.Application.Tests.Comments;

public class AddCommentCommandValidatorTests
{
    private readonly AddCommentCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenBodyEmpty_ShouldFail()
    {
        var cmd = new AddCommentCommand
        {
            ApplicationId = Guid.NewGuid(),
            Body = ""
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Body) &&
            e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenBodyTooLong_ShouldFail()
    {
        var cmd = new AddCommentCommand
        {
            ApplicationId = Guid.NewGuid(),
            Body = new string('x', 2001)
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(cmd.Body) &&
            e.ErrorMessage.Contains("2000"));
    }

    [Fact]
    public void Validate_WhenValid_ShouldPass()
    {
        var cmd = new AddCommentCommand
        {
            ApplicationId = Guid.NewGuid(),
            Body = "A beadási határidőt meg kell erősíteni."
        };

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
