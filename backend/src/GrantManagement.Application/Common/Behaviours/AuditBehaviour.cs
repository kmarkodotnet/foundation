using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using MediatR;

namespace GrantManagement.Application.Common.Behaviours;

public class AuditBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AuditBehaviour(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();

        AuditLog? entry = null;

        if (request is IAuditableCommand cmd)
        {
            entry = AuditLog.Record(
                entityType: cmd.AuditEntityType,
                entityId:   cmd.AuditEntityId,
                action:     cmd.AuditAction,
                userId:     _currentUser.UserId,
                ipAddress:  _currentUser.IpAddress);
        }
        else if (request is IAuditableCreateCommand<TResponse> createCmd)
        {
            entry = AuditLog.Record(
                entityType: createCmd.AuditEntityType,
                entityId:   createCmd.GetEntityId(response),
                action:     createCmd.AuditAction,
                userId:     _currentUser.UserId,
                ipAddress:  _currentUser.IpAddress);
        }

        if (entry is not null)
        {
            _context.AuditLogs.Add(entry);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return response;
    }
}
