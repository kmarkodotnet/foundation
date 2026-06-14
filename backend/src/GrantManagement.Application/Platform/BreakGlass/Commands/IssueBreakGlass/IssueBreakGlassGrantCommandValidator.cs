using FluentValidation;

namespace GrantManagement.Application.Platform.BreakGlass.Commands.IssueBreakGlass;

public sealed class IssueBreakGlassGrantCommandValidator : AbstractValidator<IssueBreakGlassGrantCommand>
{
    public IssueBreakGlassGrantCommandValidator()
    {
        RuleFor(x => x.TargetOwnerId).NotEmpty().WithMessage("A célzott Owner azonosítója kötelező.");
        RuleFor(x => x.Reason).NotEmpty().MinimumLength(20).WithMessage("Az indoklás legalább 20 karakter legyen.");
    }
}
