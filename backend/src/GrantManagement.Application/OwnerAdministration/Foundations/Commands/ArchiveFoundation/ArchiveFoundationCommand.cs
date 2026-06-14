using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.ArchiveFoundation;

public record ArchiveFoundationCommand(Guid FoundationId) : IRequest<ArchiveFoundationResponse>;

public record ArchiveFoundationResponse(string Status);
