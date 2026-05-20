using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Workflow.Commands.RequestApproval;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record RequestApprovalCommand(Guid ApplicationId) : IRequest<Unit>, IApplicationCommand;
