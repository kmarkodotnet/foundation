using GrantManagement.Application.Comments.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Comments.Commands.AddComment;

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, CommentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AddCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CommentDto> Handle(
        AddCommentCommand request,
        CancellationToken cancellationToken)
    {
        if (request.WorkflowStepId.HasValue)
        {
            var stepExists = await _context.WorkflowSteps
                .AsNoTracking()
                .AnyAsync(ws => ws.Id == request.WorkflowStepId.Value
                    && ws.ApplicationId == request.ApplicationId, cancellationToken);

            if (!stepExists)
                throw new NotFoundException("WorkflowStep", request.WorkflowStepId.Value);
        }

        var comment = Comment.Create(
            request.ApplicationId,
            request.Body,
            _currentUser.UserId,
            request.WorkflowStepId);

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);

        var author = await _context.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == comment.AuthorId, cancellationToken);

        return Queries.GetComments.GetCommentsQueryHandler.MapToDto(
            comment,
            author?.Name ?? "Ismeretlen",
            author?.ProfilePictureUrl);
    }
}
