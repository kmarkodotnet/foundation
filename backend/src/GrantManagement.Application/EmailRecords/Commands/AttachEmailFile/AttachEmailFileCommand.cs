using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.EmailRecords.Commands.AttachEmailFile;

public record EmailFileUpload(Stream Stream, string FileName, string ContentType, long Length);

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record AttachEmailFileCommand : IRequest<EmailRecordDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public Guid EmailRecordId { get; init; }
    public EmailFileUpload File { get; init; } = null!;
}
