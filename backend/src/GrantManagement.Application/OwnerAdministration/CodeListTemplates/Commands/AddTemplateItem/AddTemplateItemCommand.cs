using MediatR;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Commands.AddTemplateItem;

public record AddTemplateItemCommand(Guid TemplateId, string Value, string Label, int Order) : IRequest<Guid>;
