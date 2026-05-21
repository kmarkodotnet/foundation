using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSettlementTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Summary",
                table: "Settlements",
                newName: "Notes");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Settlements",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Settlements");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "Settlements",
                newName: "Summary");
        }
    }
}
