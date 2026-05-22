using GrantManagement.Application.Comments.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Comments.Commands.UpdateComment;

public class UpdateCommentCommandHandler : IRequestHandler<UpdateCommentCommand, CommentDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CommentDto> Handle(
        UpdateCommentCommand request,
        CancellationToken cancellationToken)
    {
        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.Id == request.CommentId
                && c.ApplicationId == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Comment", request.CommentId);

        var isOwner = comment.AuthorId == _currentUser.UserId;
        var isAdmin = _currentUser.Role == UserRole.Admin;

        if (!isOwner && !isAdmin)
            throw new ForbiddenException("Csak a szerző vagy az Admin szerkeszthet megjegyzést.");

        comment.Edit(request.Body);
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
