using MediatR;

namespace GrantManagement.Application.Platform.Owners.Commands.ProvisionOwner;

public record ProvisionOwnerCommand(
    string Name,
    string ContactEmail,
    string InitialOwnerAdminEmail) : IRequest<ProvisionOwnerResponse>;

public record ProvisionOwnerResponse(Guid Id, string Name, string Status);
