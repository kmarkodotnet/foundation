using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Invoices.Commands.DeleteInvoice;

[RequireRole(UserRole.Admin, UserRole.Penzugyes)]
public record DeleteInvoiceCommand(
    Guid ApplicationId,
    Guid InvoiceId
) : IRequest, IApplicationCommand;
