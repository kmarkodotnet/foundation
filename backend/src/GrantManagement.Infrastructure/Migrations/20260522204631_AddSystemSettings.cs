using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    NotificationWarningDays = table.Column<int>(type: "integer", nullable: false),
                    SpendingWarningDays = table.Column<int>(type: "integer", nullable: false),
                    MaxFileSizeMb = table.Column<int>(type: "integer", nullable: false),
                    OrganizationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DefaultUserRole = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "DefaultUserRole", "MaxFileSizeMb", "NotificationWarningDays", "OrganizationName", "SpendingWarningDays", "UpdatedAt" },
                values: new object[] { 1, "Megtekinto", 50, 7, "Alapítvány", 14, new DateTimeOffset(new DateTime(2026, 5, 22, 20, 46, 30, 186, DateTimeKind.Unspecified).AddTicks(9158), new TimeSpan(0, 0, 0, 0, 0)) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
