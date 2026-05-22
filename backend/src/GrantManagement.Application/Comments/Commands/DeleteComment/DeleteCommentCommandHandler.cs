using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Comments.Commands.DeleteComment;

public class DeleteCommentCommandHandler : IRequestHandler<DeleteCommentCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteCommentCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = await _context.Comments
            .FirstOrDefaultAsync(c => c.Id == request.CommentId
                && c.ApplicationId == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Comment", request.CommentId);

        var isOwner = comment.AuthorId == _currentUser.UserId;
        var isAdmin = _currentUser.Role == UserRole.Admin;

        if (!isOwner && !isAdmin)
            throw new ForbiddenException("Csak a szerző vagy az Admin törölhet megjegyzést.");

        comment.Delete();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
