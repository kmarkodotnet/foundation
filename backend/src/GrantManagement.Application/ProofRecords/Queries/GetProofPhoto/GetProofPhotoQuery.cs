using GrantManagement.Application.ProofRecords.DTOs;
using MediatR;

namespace GrantManagement.Application.ProofRecords.Queries.GetProofPhoto;

public record GetProofPhotoQuery(
    Guid ApplicationId,
    Guid ProofRecordId,
    Guid PhotoId) : IRequest<ProofPhotoFileResult>;
