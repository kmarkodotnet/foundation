using GrantManagement.Application.Applications.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Applications.Queries.ExportApplications;

[RequireRole(UserRole.Admin, UserRole.Elnok, UserRole.Penzugyes)]
public record ExportApplicationsQuery(
    string? SearchTerm = null,
    Guid? GranterId = null,
    Guid? ApplicationTypeId = null,
    ApplicationStatus[]? Statuses = null,
    DateOnly? SubmissionDeadlineFrom = null,
    DateOnly? SubmissionDeadlineTo = null,
    decimal? AwardedAmountMin = null,
    decimal? AwardedAmountMax = null,
    bool IncludeArchived = false
) : IRequest<ExportResult>;
