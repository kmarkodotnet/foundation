using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.DeleteCodeList;

[RequireRole(UserRole.Admin)]
public record DeleteCodeListCommand(Guid CodeListId) : IRequest;
