using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Invoices.Commands.MarkInvoicePaid;

[RequireRole(UserRole.Admin, UserRole.Penzugyes)]
public record MarkInvoicePaidCommand(
    Guid ApplicationId,
    Guid InvoiceId,
    DateOnly PaymentDate
) : IRequest<InvoiceDto>, IApplicationCommand;
