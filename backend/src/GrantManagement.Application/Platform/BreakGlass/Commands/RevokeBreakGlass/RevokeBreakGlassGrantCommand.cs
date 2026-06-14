using MediatR;

namespace GrantManagement.Application.Platform.BreakGlass.Commands.RevokeBreakGlass;

public record RevokeBreakGlassGrantCommand(Guid GrantId) : IRequest<RevokeBreakGlassGrantResponse>;

public record RevokeBreakGlassGrantResponse(string Status, DateTimeOffset RevokedAt);
