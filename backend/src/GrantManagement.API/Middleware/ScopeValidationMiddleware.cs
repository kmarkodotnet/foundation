using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Common.Scope;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GrantManagement.API.Middleware;

public class ScopeValidationMiddleware
{
    private readonly RequestDelegate _next;

    public ScopeValidationMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ICurrentScopeService scope)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var audience = scope.Audience;

            if (path.StartsWith("/api/v1/platform/") && audience != "platform")
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { error = "Platform audience szükséges." });
                return;
            }

            if (path.StartsWith("/api/v1/owner/") && audience != "owner")
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { error = "Owner audience szükséges." });
                return;
            }

            // Break-glass grant validity check
            var breakGlassGrantId = scope.BreakGlassGrantId;
            if (breakGlassGrantId.HasValue)
            {
                var db = context.RequestServices.GetRequiredService<IApplicationDbContext>();
                var grant = await db.BreakGlassGrants
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.Id == breakGlassGrantId.Value);

                if (grant == null || !grant.IsValidAt(DateTimeOffset.UtcNow))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { error = "Break-glass hozzáférés lejárt vagy visszavonva." });
                    return;
                }
            }
        }

        await _next(context);
    }
}
