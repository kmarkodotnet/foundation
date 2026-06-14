using MediatR;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.UpdateTemplateItem;

public record UpdateTemplateItemCommand(Guid TemplateId, Guid ItemId, string Value, string Label, int Order) : IRequest;
