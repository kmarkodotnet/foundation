using GrantManagement.Application.Comments.DTOs;
using GrantManagement.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Comments.Queries.GetComments;

public class GetCommentsQueryHandler : IRequestHandler<GetCommentsQuery, List<CommentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCommentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommentDto>> Handle(
        GetCommentsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Comments
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(c => c.ApplicationId == request.ApplicationId);

        if (request.WorkflowStepId.HasValue)
            query = query.Where(c => c.WorkflowStepId == request.WorkflowStepId.Value);

        var comments = await query
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        var authorIds = comments.Select(c => c.AuthorId).Distinct().ToList();
        var authors = await _context.AppUsers
            .AsNoTracking()
            .Where(u => authorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u, cancellationToken);

        return comments.Select(c =>
        {
            authors.TryGetValue(c.AuthorId, out var author);
            return MapToDto(c, author?.Name ?? "Ismeretlen", author?.ProfilePictureUrl);
        }).ToList();
    }

    internal static CommentDto MapToDto(
        Domain.Entities.Comment comment,
        string authorName,
        string? authorAvatarUrl) => new()
    {
        Id = comment.Id,
        ApplicationId = comment.ApplicationId,
        WorkflowStepId = comment.WorkflowStepId,
        Body = comment.Body,
        AuthorId = comment.AuthorId,
        AuthorName = authorName,
        AuthorAvatarUrl = authorAvatarUrl,
        IsDeleted = comment.IsDeleted,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt,
    };
}
