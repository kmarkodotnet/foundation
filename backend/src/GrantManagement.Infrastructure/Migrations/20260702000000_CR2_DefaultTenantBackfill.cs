using GrantManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <summary>
    /// US-230: a CR2 előtti single-tenant adatok default Owner + default Foundation alá
    /// rendelése. Minden lépés idempotens (US-230 AC8); a migráció egyirányú (US-230 AC9).
    /// </summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20260702000000_CR2_DefaultTenantBackfill")]
    public partial class CR2_DefaultTenantBackfill : Migration
    {
        private const string DefaultOwnerId = "00000000-0000-0000-0000-000000000001";
        private const string DefaultFoundationId = "00000000-0000-0000-0000-000000000001";
        private const string ZeroGuid = "00000000-0000-0000-0000-000000000000";

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"
INSERT INTO ""Owners"" (""Id"", ""Name"", ""ContactEmail"", ""Status"", ""CreatedAt"", ""UpdatedAt"")
VALUES ('{DefaultOwnerId}', 'Default Owner', 'admin@localhost', 'Active', now(), now())
ON CONFLICT (""Id"") DO NOTHING;

INSERT INTO ""Foundations"" (""Id"", ""OwnerId"", ""Name"", ""LogoUri"", ""Status"", ""CreatedAt"", ""UpdatedAt"")
VALUES ('{DefaultFoundationId}', '{DefaultOwnerId}', 'Default Foundation', NULL, 'Active', now(), now())
ON CONFLICT (""Id"") DO NOTHING;
");

            foreach (var table in new[] { "Applications", "Granters", "Vendors", "CodeLists", "Notifications" })
            {
                migrationBuilder.Sql($@"
UPDATE ""{table}"" SET ""OwnerId"" = '{DefaultOwnerId}' WHERE ""OwnerId"" = '{ZeroGuid}';
UPDATE ""{table}"" SET ""FoundationId"" = '{DefaultFoundationId}' WHERE ""FoundationId"" = '{ZeroGuid}';
");
            }

            migrationBuilder.Sql($@"
UPDATE ""AppUsers""
SET ""OwnerId"" = '{DefaultOwnerId}'
WHERE ""OwnerId"" IS NULL AND ""PlatformRole"" IS NULL;

INSERT INTO ""FoundationUserAssignments""
    (""Id"", ""AppUserId"", ""FoundationId"", ""FoundationRole"",
     ""AssignedAt"", ""AssignedByUserId"", ""IsActive"", ""CreatedAt"", ""UpdatedAt"")
SELECT
    md5(u.""Id""::text || '{DefaultFoundationId}')::uuid,
    u.""Id"",
    '{DefaultFoundationId}',
    CASE u.""Role"" WHEN 'Admin' THEN 'FoundationAdmin' ELSE u.""Role"" END,
    now(), u.""Id"", TRUE, now(), now()
FROM ""AppUsers"" u
WHERE u.""OwnerId"" = '{DefaultOwnerId}'
  AND u.""PlatformRole"" IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM ""FoundationUserAssignments"" a
      WHERE a.""AppUserId"" = u.""Id"" AND a.""FoundationId"" = '{DefaultFoundationId}');
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // US-230 AC9: a migráció egyirányú; visszaállás csak a migráció előtti
            // adatbázis-snapshotból lehetséges.
        }
    }
}
