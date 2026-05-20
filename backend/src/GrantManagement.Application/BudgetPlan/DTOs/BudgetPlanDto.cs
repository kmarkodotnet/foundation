namespace GrantManagement.Application.BudgetPlan.DTOs;

public class BudgetPlanDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string? Notes { get; init; }
    public decimal TotalPlanned { get; init; }
    public decimal? AwardedAmount { get; init; }
    public decimal? Difference { get; init; }
    public DateTimeOffset? ApprovedAt { get; init; }
    public Guid? ApprovedByUserId { get; init; }
    public IReadOnlyList<BudgetItemDto> Items { get; init; } = [];
}

public class BudgetItemDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = null!;
    public string Type { get; init; } = null!;
    public string? Description { get; init; }
    public decimal PlannedAmount { get; init; }
    public int SortOrder { get; init; }
}
