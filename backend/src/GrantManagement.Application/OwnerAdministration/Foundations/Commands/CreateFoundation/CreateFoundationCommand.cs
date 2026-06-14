using MediatR;

namespace GrantManagement.Application.OwnerAdministration.Foundations.Commands.CreateFoundation;

public record CreateFoundationCommand(
    string Name,
    string? LogoUri,
    string InitialFoundationAdminEmail,
    Guid? TemplateFoundationId) : IRequest<CreateFoundationResponse>;

public record CreateFoundationResponse(Guid Id, string Name, string Status);
