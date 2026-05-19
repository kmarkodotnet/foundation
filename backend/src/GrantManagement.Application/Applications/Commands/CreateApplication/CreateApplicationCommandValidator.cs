using FluentValidation;

namespace GrantManagement.Application.Applications.Commands.CreateApplication;

public class CreateApplicationCommandValidator : AbstractValidator<CreateApplicationCommand>
{
    public CreateApplicationCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("A pályázat neve kötelező.")
            .MaximumLength(500).WithMessage("A pályázat neve maximum 500 karakter lehet.");

        RuleFor(x => x.GranterId)
            .NotEmpty().WithMessage("A pályáztató megadása kötelező.");

        RuleFor(x => x.SubmissionDeadline)
            .NotEmpty().WithMessage("A beadási határidő kötelező.")
            .GreaterThan(DateTimeOffset.UtcNow).WithMessage("A beadási határidőnek a jövőben kell lennie.");
    }
}
