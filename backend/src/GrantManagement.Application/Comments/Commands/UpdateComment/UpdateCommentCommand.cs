using GrantManagement.Application.Comments.DTOs;
using GrantManagement.Application.Common.Interfaces;
using MediatR;

namespace GrantManagement.Application.Comments.Commands.UpdateComment;

public record UpdateCommentCommand : IRequest<CommentDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public Guid CommentId { get; init; }
    public string Body { get; init; } = null!;
}
