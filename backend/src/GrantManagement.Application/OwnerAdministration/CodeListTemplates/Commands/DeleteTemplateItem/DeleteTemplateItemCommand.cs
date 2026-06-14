using MediatR;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.DeleteTemplateItem;

public record DeleteTemplateItemCommand(Guid TemplateId, Guid ItemId) : IRequest;
