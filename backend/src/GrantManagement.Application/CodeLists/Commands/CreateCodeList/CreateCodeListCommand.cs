using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.Common.Attributes;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.CodeLists.Commands.CreateCodeList;

[RequireRole(UserRole.Admin)]
public record CreateCodeListCommand(string Name, string? Description) : IRequest<CodeListDto>;
