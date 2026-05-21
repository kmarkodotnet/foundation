using GrantManagement.Application.Common.Attributes;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Domain.Enums;
using MediatR;

namespace GrantManagement.Application.Invoices.Commands.CreateInvoice;

[RequireRole(UserRole.Admin, UserRole.Penzugyes)]
public record CreateInvoiceCommand(
    Guid ApplicationId,
    string SupplierName,
    string InvoiceNumber,
    DateOnly IssueDate,
    decimal Amount,
    bool IsPaid,
    DateOnly? PaymentDate,
    Guid? VendorContractId,
    Guid? BudgetItemId,
    string? Notes
) : IRequest<InvoiceDto>, IApplicationCommand;
