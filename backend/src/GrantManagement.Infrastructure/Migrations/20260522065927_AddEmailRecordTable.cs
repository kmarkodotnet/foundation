using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailRecordTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowStepId = table.Column<Guid>(type: "uuid", nullable: true),
                    Subject = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    SenderEmail = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SentDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ContentSummary = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    AttachmentStoragePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AttachmentFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AttachmentContentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EmlFrom = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EmlSubject = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EmlDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EmlBody = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailRecords_ApplicationId",
                table: "EmailRecords",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailRecords_WorkflowStepId",
                table: "EmailRecords",
                column: "WorkflowStepId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailRecords");
        }
    }
}
