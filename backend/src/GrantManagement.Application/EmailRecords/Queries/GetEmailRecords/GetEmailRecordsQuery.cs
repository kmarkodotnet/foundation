using GrantManagement.Application.EmailRecords.DTOs;
using MediatR;

namespace GrantManagement.Application.EmailRecords.Queries.GetEmailRecords;

public record GetEmailRecordsQuery(Guid ApplicationId, Guid? WorkflowStepId = null)
    : IRequest<List<EmailRecordDto>>;
