using GrantManagement.Domain.Tenancy.Enums;

namespace GrantManagement.Application.OwnerAdministration.Users.DTOs;

public record FoundationRoleAssignment(Guid FoundationId, FoundationRole Role);
