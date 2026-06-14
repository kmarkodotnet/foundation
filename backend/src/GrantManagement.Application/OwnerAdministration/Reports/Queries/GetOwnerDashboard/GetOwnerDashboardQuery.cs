using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Reports.Queries.GetOwnerDashboard;

public record GetOwnerDashboardQuery : IRequest<OwnerDashboardResponse>;

public record OwnerDashboardResponse(
    decimal TotalWonAmount,
    decimal TotalUnaccountedAmount,
    IReadOnlyList<FoundationDashboardItem> Foundations);

public record FoundationDashboardItem(
    Guid FoundationId,
    string FoundationName,
    int InProgress,
    int Won,
    int Lost,
    int Submitted,
    decimal WonAmount);
