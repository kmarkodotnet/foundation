using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CR1_InvitationModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultUserRole",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Applications");

            migrationBuilder.AddColumn<int>(
                name: "InvitationExpiryHours",
                table: "SystemSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Invitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invitations", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "InvitationExpiryHours", "UpdatedAt" },
                values: new object[] { 72, new DateTimeOffset(new DateTime(2026, 6, 13, 7, 7, 11, 590, DateTimeKind.Unspecified).AddTicks(9416), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.CreateIndex(
                name: "IX_Invitations_Email_Status",
                table: "Invitations",
                columns: new[] { "Email", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Invitations_Token",
                table: "Invitations",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Invitations");

            migrationBuilder.DropColumn(
                name: "InvitationExpiryHours",
                table: "SystemSettings");

            migrationBuilder.AddColumn<string>(
                name: "DefaultUserRole",
                table: "SystemSettings",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Applications",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.UpdateData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DefaultUserRole", "UpdatedAt" },
                values: new object[] { "Megtekinto", new DateTimeOffset(new DateTime(2026, 5, 22, 20, 46, 30, 186, DateTimeKind.Unspecified).AddTicks(9158), new TimeSpan(0, 0, 0, 0, 0)) });
        }
    }
}
