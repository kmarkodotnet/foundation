using GrantManagement.Application.ProofRecords.DTOs;
using MediatR;

namespace GrantManagement.Application.ProofRecords.Queries.DownloadAllProofPhotos;

public record DownloadAllProofPhotosQuery(
    Guid ApplicationId,
    Guid ProofRecordId) : IRequest<ProofPhotoFileResult>;
