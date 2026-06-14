using MediatR;

namespace GrantManagement.Application.OwnerAdministration.CodeListTemplates.Queries.GetOwnerCodeListTemplateDetails;

public record GetOwnerCodeListTemplateDetailsQuery(Guid TemplateId) : IRequest<OwnerCodeListTemplateDetailsResponse>;

public record OwnerCodeListTemplateDetailsResponse(
    Guid Id,
    string Name,
    string Code,
    IReadOnlyList<OwnerCodeListTemplateItemResponse> Items);

public record OwnerCodeListTemplateItemResponse(Guid Id, string Value, string Label, int Order);
