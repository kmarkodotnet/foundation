using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record CreateEmailRecordCommand : IRequest<EmailRecordDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public Guid? WorkflowStepId { get; init; }
    public string Subject { get; init; } = null!;
    public string SenderEmail { get; init; } = null!;
    public DateOnly SentDate { get; init; }
    public string Direction { get; init; } = null!;
    public string? ContentSummary { get; init; }
}
