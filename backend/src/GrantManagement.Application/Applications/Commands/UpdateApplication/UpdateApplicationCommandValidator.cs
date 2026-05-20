using FluentValidation;

namespace GrantManagement.Application.Applications.Commands.UpdateApplication;

public class UpdateApplicationCommandValidator : AbstractValidator<UpdateApplicationCommand>
{
    public UpdateApplicationCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("A pályázat neve kötelező.")
            .MaximumLength(500).WithMessage("A pályázat neve maximum 500 karakter lehet.");

        RuleFor(x => x.SubmissionDeadline)
            .NotEmpty().WithMessage("A beadási határidő kötelező.");
    }
}
