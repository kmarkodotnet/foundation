using MediatR;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.ApplyTemplateToFoundation;

public record ApplyTemplateToFoundationCommand(Guid TemplateId, Guid TargetFoundationId) : IRequest<ApplyTemplateToFoundationResponse>;

public record ApplyTemplateToFoundationResponse(int AddedItemsCount);
