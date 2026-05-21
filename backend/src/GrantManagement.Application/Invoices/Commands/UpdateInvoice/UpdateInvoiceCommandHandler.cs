using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invoices.Commands.UpdateInvoice;

public class UpdateInvoiceCommandHandler : IRequestHandler<UpdateInvoiceCommand, InvoiceDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateInvoiceCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InvoiceDto> Handle(UpdateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.ApplicationId == request.ApplicationId && i.Id == request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Invoice), request.InvoiceId);

        invoice.Update(
            request.SupplierName,
            request.InvoiceNumber,
            request.IssueDate,
            request.Amount,
            request.IsPaid,
            request.PaymentDate,
            request.VendorContractId,
            request.BudgetItemId,
            request.Notes);

        await _context.SaveChangesAsync(cancellationToken);

        return new InvoiceDto
        {
            Id = invoice.Id,
            ApplicationId = invoice.ApplicationId,
            SupplierName = invoice.SupplierName,
            InvoiceNumber = invoice.InvoiceNumber,
            IssueDate = invoice.IssueDate,
            Amount = invoice.Amount,
            IsPaid = invoice.IsPaid,
            PaymentDate = invoice.PaymentDate,
            VendorContractId = invoice.VendorContractId,
            BudgetItemId = invoice.BudgetItemId,
            Notes = invoice.Notes,
            CreatedByUserId = invoice.CreatedByUserId,
            CreatedAt = invoice.CreatedAt,
            UpdatedAt = invoice.UpdatedAt,
        };
    }
}
