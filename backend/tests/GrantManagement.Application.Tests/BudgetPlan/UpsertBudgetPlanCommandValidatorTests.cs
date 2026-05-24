using FluentAssertions;
using GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;
using GrantManagement.Domain.Enums;

namespace GrantManagement.Application.Tests.BudgetPlan;

public class UpsertBudgetPlanCommandValidatorTests
{
    private readonly UpsertBudgetPlanCommandValidator _sut = new();

    [Fact]
    public void Validate_WhenItemNameIsEmpty_ShouldFail()
    {
        var cmd = new UpsertBudgetPlanCommand(
            ApplicationId: Guid.NewGuid(),
            Notes: null,
            Items:
            [
                new UpsertBudgetItemDto(null, "", BudgetItemType.Asset, 100_000m, null, 1)
            ]);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("kötelező"));
    }

    [Fact]
    public void Validate_WhenItemPlannedAmountIsZero_ShouldFail()
    {
        var cmd = new UpsertBudgetPlanCommand(
            ApplicationId: Guid.NewGuid(),
            Notes: null,
            Items:
            [
                new UpsertBudgetItemDto(null, "Laptop", BudgetItemType.Asset, 0m, null, 1)
            ]);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("pozitív"));
    }

    [Fact]
    public void Validate_WhenItemsAreValid_ShouldPass()
    {
        var cmd = new UpsertBudgetPlanCommand(
            ApplicationId: Guid.NewGuid(),
            Notes: "Megjegyzés",
            Items:
            [
                new UpsertBudgetItemDto(null, "Nyári tábor", BudgetItemType.Event, 500_000m, "Leírás", 1),
                new UpsertBudgetItemDto(null, "Laptop", BudgetItemType.Asset, 350_000m, null, 2)
            ]);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_WhenItemsListIsEmpty_ShouldPass()
    {
        var cmd = new UpsertBudgetPlanCommand(
            ApplicationId: Guid.NewGuid(),
            Notes: null,
            Items: []);

        var result = _sut.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }
}
