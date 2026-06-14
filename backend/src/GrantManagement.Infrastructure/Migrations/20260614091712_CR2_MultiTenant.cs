using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CR2_MultiTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "Vendors",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Vendors",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "Notifications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Notifications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "FoundationAssignmentsJson",
                table: "Invitations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "Invitations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FoundationRole",
                table: "Invitations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Invitations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerRole",
                table: "Invitations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformRole",
                table: "Invitations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Scope",
                table: "Invitations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "Granters",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Granters",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "CodeLists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "CodeLists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "AuditLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "AuditLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "AppUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerRole",
                table: "AppUsers",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformRole",
                table: "AppUsers",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FoundationId",
                table: "Applications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Applications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "BreakGlassGrants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlatformAdminUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetOwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BreakGlassGrants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Foundations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LogoUri = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Foundations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FoundationUserAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FoundationId = table.Column<Guid>(type: "uuid", nullable: false),
                    FoundationRole = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AssignedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FoundationUserAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FoundationUserAssignments_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OwnerCodeListTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OwnerCodeListTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Owners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Owners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlatformSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MaxFileSizeMb = table.Column<int>(type: "integer", nullable: false),
                    InvitationExpiryHours = table.Column<int>(type: "integer", nullable: false),
                    DefaultDeadlineNotificationDays = table.Column<int>(type: "integer", nullable: false),
                    DefaultOwnerCodeListTemplateId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OwnerCodeListTemplateItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Label = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OwnerCodeListTemplateItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OwnerCodeListTemplateItems_OwnerCodeListTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "OwnerCodeListTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "CodeLists",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000001"),
                columns: new[] { "FoundationId", "OwnerId" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000000"), new Guid("00000000-0000-0000-0000-000000000000") });

            migrationBuilder.UpdateData(
                table: "CodeLists",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000002"),
                columns: new[] { "FoundationId", "OwnerId" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000000"), new Guid("00000000-0000-0000-0000-000000000000") });

            migrationBuilder.UpdateData(
                table: "CodeLists",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000003"),
                columns: new[] { "FoundationId", "OwnerId" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000000"), new Guid("00000000-0000-0000-0000-000000000000") });

            migrationBuilder.UpdateData(
                table: "CodeLists",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000004"),
                columns: new[] { "FoundationId", "OwnerId" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000000"), new Guid("00000000-0000-0000-0000-000000000000") });

            migrationBuilder.InsertData(
                table: "PlatformSettings",
                columns: new[] { "Id", "CreatedAt", "DefaultDeadlineNotificationDays", "DefaultOwnerCodeListTemplateId", "InvitationExpiryHours", "MaxFileSizeMb", "UpdatedAt" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), new DateTimeOffset(new DateTime(2026, 6, 14, 9, 17, 11, 69, DateTimeKind.Unspecified).AddTicks(7174), new TimeSpan(0, 0, 0, 0, 0)), 7, null, 72, 50, new DateTimeOffset(new DateTime(2026, 6, 14, 9, 17, 11, 69, DateTimeKind.Unspecified).AddTicks(7177), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTimeOffset(new DateTime(2026, 6, 14, 9, 17, 11, 70, DateTimeKind.Unspecified).AddTicks(4402), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_OwnerId_FoundationId",
                table: "AuditLogs",
                columns: new[] { "OwnerId", "FoundationId" });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_OwnerId",
                table: "AppUsers",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BreakGlassGrants_Status_ExpiresAt",
                table: "BreakGlassGrants",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BreakGlassGrants_TargetOwnerId",
                table: "BreakGlassGrants",
                column: "TargetOwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Foundations_OwnerId",
                table: "Foundations",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Foundations_OwnerId_Status",
                table: "Foundations",
                columns: new[] { "OwnerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FoundationUserAssignments_AppUserId_FoundationId",
                table: "FoundationUserAssignments",
                columns: new[] { "AppUserId", "FoundationId" },
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_FoundationUserAssignments_FoundationId",
                table: "FoundationUserAssignments",
                column: "FoundationId");

            migrationBuilder.CreateIndex(
                name: "IX_OwnerCodeListTemplateItems_TemplateId",
                table: "OwnerCodeListTemplateItems",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_OwnerCodeListTemplates_OwnerId",
                table: "OwnerCodeListTemplates",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Owners_Status",
                table: "Owners",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BreakGlassGrants");

            migrationBuilder.DropTable(
                name: "Foundations");

            migrationBuilder.DropTable(
                name: "FoundationUserAssignments");

            migrationBuilder.DropTable(
                name: "OwnerCodeListTemplateItems");

            migrationBuilder.DropTable(
                name: "Owners");

            migrationBuilder.DropTable(
                name: "PlatformSettings");

            migrationBuilder.DropTable(
                name: "OwnerCodeListTemplates");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_OwnerId_FoundationId",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_OwnerId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "FoundationAssignmentsJson",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "FoundationRole",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "OwnerRole",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "PlatformRole",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "Scope",
                table: "Invitations");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "Granters");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Granters");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "CodeLists");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "CodeLists");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "OwnerRole",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "PlatformRole",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "FoundationId",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Applications");

            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTimeOffset(new DateTime(2026, 6, 13, 7, 7, 11, 590, DateTimeKind.Unspecified).AddTicks(9416), new TimeSpan(0, 0, 0, 0, 0)));
        }
    }
}
