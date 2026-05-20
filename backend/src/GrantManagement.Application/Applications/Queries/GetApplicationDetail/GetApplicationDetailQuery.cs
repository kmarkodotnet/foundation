using GrantManagement.Application.Applications.DTOs;
using MediatR;

namespace GrantManagement.Application.Applications.Queries.GetApplicationDetail;

public record GetApplicationDetailQuery(Guid ApplicationId) : IRequest<ApplicationDetailDto>;
