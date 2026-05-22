using GrantManagement.Application.Common.Interfaces;
using MediatR;

namespace GrantManagement.Application.Comments.Commands.DeleteComment;

public record DeleteCommentCommand(Guid ApplicationId, Guid CommentId)
    : IRequest, IApplicationCommand;
