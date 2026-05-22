using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.EmailRecords.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.EmailRecords.Commands.CreateEmailRecord;

public class CreateEmailRecordCommandHandler
    : IRequestHandler<CreateEmailRecordCommand, EmailRecordDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateEmailRecordCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<EmailRecordDto> Handle(
        CreateEmailRecordCommand request,
        CancellationToken cancellationToken)
    {
        var appExists = await _context.Applications
            .AsNoTracking()
            .AnyAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (!appExists)
            throw new NotFoundException("Application", request.ApplicationId);

        if (request.WorkflowStepId.HasValue)
        {
            var stepExists = await _context.WorkflowSteps
                .AsNoTracking()
                .AnyAsync(ws => ws.Id == request.WorkflowStepId.Value
                    && ws.ApplicationId == request.ApplicationId, cancellationToken);

            if (!stepExists)
                throw new NotFoundException("WorkflowStep", request.WorkflowStepId.Value);
        }

        if (!Enum.TryParse<EmailDirection>(request.Direction, out var direction))
            throw new DomainException("Érvénytelen irány érték.");

        var record = EmailRecord.Create(
            request.ApplicationId,
            request.Subject,
            request.SenderEmail,
            request.SentDate,
            direction,
            _currentUser.UserId,
            request.WorkflowStepId,
            request.ContentSummary);

        _context.EmailRecords.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        var creator = await _context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == record.CreatedByUserId, cancellationToken);

        return MapToDto(record, creator?.Name ?? "Ismeretlen");
    }

    internal static EmailRecordDto MapToDto(EmailRecord record, string createdByName) => new()
    {
        Id = record.Id,
        ApplicationId = record.ApplicationId,
        WorkflowStepId = record.WorkflowStepId,
        Subject = record.Subject,
        SenderEmail = record.SenderEmail,
        SentDate = record.SentDate,
        Direction = record.Direction.ToString(),
        ContentSummary = record.ContentSummary,
        HasAttachment = record.AttachmentStoragePath != null,
        AttachmentFileName = record.AttachmentFileName,
        CreatedByUserId = record.CreatedByUserId,
        CreatedByName = createdByName,
        CreatedAt = record.CreatedAt
    };
}
