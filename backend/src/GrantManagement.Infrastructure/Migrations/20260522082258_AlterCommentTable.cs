using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AlterCommentTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_WorkflowSteps_WorkflowStepId",
                table: "Comments");

            migrationBuilder.RenameColumn(
                name: "Text",
                table: "Comments",
                newName: "Body");

            migrationBuilder.RenameColumn(
                name: "AuthorUserId",
                table: "Comments",
                newName: "AuthorId");

            migrationBuilder.AlterColumn<Guid>(
                name: "WorkflowStepId",
                table: "Comments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "ApplicationId",
                table: "Comments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedAt",
                table: "Comments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_ApplicationId",
                table: "Comments",
                column: "ApplicationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Applications_ApplicationId",
                table: "Comments",
                column: "ApplicationId",
                principalTable: "Applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_WorkflowSteps_WorkflowStepId",
                table: "Comments",
                column: "WorkflowStepId",
                principalTable: "WorkflowSteps",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Applications_ApplicationId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_WorkflowSteps_WorkflowStepId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_ApplicationId",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "ApplicationId",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Comments");

            migrationBuilder.RenameColumn(
                name: "Body",
                table: "Comments",
                newName: "Text");

            migrationBuilder.RenameColumn(
                name: "AuthorId",
                table: "Comments",
                newName: "AuthorUserId");

            migrationBuilder.AlterColumn<Guid>(
                name: "WorkflowStepId",
                table: "Comments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_WorkflowSteps_WorkflowStepId",
                table: "Comments",
                column: "WorkflowStepId",
                principalTable: "WorkflowSteps",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
