using GrantManagement.Application.Comments.DTOs;
using GrantManagement.Application.Common.Interfaces;
using MediatR;

namespace GrantManagement.Application.Comments.Commands.AddComment;

public record AddCommentCommand : IRequest<CommentDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public Guid? WorkflowStepId { get; init; }
    public string Body { get; init; } = null!;
}
