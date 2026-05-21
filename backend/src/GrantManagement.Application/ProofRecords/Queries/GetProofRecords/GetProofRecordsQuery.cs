using GrantManagement.Application.ProofRecords.DTOs;
using MediatR;

namespace GrantManagement.Application.ProofRecords.Queries.GetProofRecords;

public record GetProofRecordsQuery(Guid ApplicationId) : IRequest<List<ProofRecordDto>>;
