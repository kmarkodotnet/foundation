using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBudgetPlanTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmountValue",
                table: "BudgetItems");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "BudgetItems");

            migrationBuilder.RenameColumn(
                name: "Order",
                table: "BudgetItems",
                newName: "SortOrder");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "BudgetItems",
                newName: "Description");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "BudgetPlans",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "BudgetItems",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<decimal>(
                name: "PlannedAmount",
                table: "BudgetItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "BudgetItems",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "BudgetPlans");

            migrationBuilder.DropColumn(
                name: "PlannedAmount",
                table: "BudgetItems");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "BudgetItems");

            migrationBuilder.RenameColumn(
                name: "SortOrder",
                table: "BudgetItems",
                newName: "Order");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "BudgetItems",
                newName: "Category");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "BudgetItems",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300);

            migrationBuilder.AddColumn<decimal>(
                name: "AmountValue",
                table: "BudgetItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "BudgetItems",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
