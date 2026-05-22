using FluentValidation;

namespace GrantManagement.Application.Search.Queries;

public class GlobalSearchQueryValidator : AbstractValidator<GlobalSearchQuery>
{
    public GlobalSearchQueryValidator()
    {
        RuleFor(q => q.SearchTerm)
            .NotEmpty()
            .MinimumLength(3)
            .WithMessage("A keresési kifejezés legalább 3 karakter kell legyen.");
    }
}
