using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrantManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProofPhotoTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_ProofRecords_ProofRecordId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_ProofRecordId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "ProofRecordId",
                table: "Documents");

            migrationBuilder.AlterColumn<string>(
                name: "ProofType",
                table: "ProofRecords",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ProofRecords",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ProofRecords",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ProofPhotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProofRecordId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StoragePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProofPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProofPhotos_ProofRecords_ProofRecordId",
                        column: x => x.ProofRecordId,
                        principalTable: "ProofRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProofPhotos_ProofRecordId",
                table: "ProofPhotos",
                column: "ProofRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProofPhotos");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ProofRecords");

            migrationBuilder.AlterColumn<string>(
                name: "ProofType",
                table: "ProofRecords",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ProofRecords",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ProofRecordId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ProofRecordId",
                table: "Documents",
                column: "ProofRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_ProofRecords_ProofRecordId",
                table: "Documents",
                column: "ProofRecordId",
                principalTable: "ProofRecords",
                principalColumn: "Id");
        }
    }
}
