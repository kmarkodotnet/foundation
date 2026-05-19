using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class _20260519000001_AddAppUserLastLogoutAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastLogoutAt",
                table: "AppUsers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastLogoutAt",
                table: "AppUsers");
        }
    }
}
