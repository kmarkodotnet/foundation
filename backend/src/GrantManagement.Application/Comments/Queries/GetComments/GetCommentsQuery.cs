using GrantManagement.Application.Comments.DTOs;
using MediatR;

namespace GrantManagement.Application.Comments.Queries.GetComments;

public record GetCommentsQuery(Guid ApplicationId, Guid? WorkflowStepId = null)
    : IRequest<List<CommentDto>>;
