using MediatR;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Queries.GetOwnerCodeListTemplates;

public record GetOwnerCodeListTemplatesQuery : IRequest<IReadOnlyList<OwnerCodeListTemplateListItemResponse>>;

public record OwnerCodeListTemplateListItemResponse(Guid Id, string Name, string Code, int ItemCount);
