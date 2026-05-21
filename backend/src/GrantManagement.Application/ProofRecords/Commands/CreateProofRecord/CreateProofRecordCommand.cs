using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.ProofRecords.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.ProofRecords.Commands.CreateProofRecord;

[RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
public record CreateProofRecordCommand : IRequest<ProofRecordDto>, IApplicationCommand
{
    public Guid ApplicationId { get; init; }
    public string ProofType { get; init; } = null!;
    public DateOnly EventDate { get; init; }
    public string? Notes { get; init; }
    public IList<PhotoUpload> Photos { get; init; } = [];
}
