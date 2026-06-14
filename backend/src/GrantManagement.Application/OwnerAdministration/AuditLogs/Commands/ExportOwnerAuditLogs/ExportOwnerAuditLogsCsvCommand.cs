using MediatR;

namespace GrantManagement.Application.OwnerAdministration.AuditLogs.Commands.ExportOwnerAuditLogs;

public record ExportOwnerAuditLogsCsvCommand(
    Guid? FoundationId,
    Guid? UserId,
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate) : IRequest<ExportOwnerAuditLogsCsvResponse>;

public record ExportOwnerAuditLogsCsvResponse(byte[] CsvBytes, string FileName);
