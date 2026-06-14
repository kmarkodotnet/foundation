using MediatR;

namespace GrantManagement.Application.Platform.BreakGlass.Commands.IssueBreakGlass;

public record IssueBreakGlassGrantCommand(Guid TargetOwnerId, string Reason) : IRequest<IssueBreakGlassGrantResponse>;

public record IssueBreakGlassGrantResponse(Guid GrantId, string AccessToken, DateTimeOffset ExpiresAt);
