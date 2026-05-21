using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invoices.Commands.MarkInvoicePaid;

public class MarkInvoicePaidCommandHandler : IRequestHandler<MarkInvoicePaidCommand, InvoiceDto>
{
    private readonly IApplicationDbContext _context;

    public MarkInvoicePaidCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InvoiceDto> Handle(MarkInvoicePaidCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.ApplicationId == request.ApplicationId && i.Id == request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Invoice), request.InvoiceId);

        if (invoice.IsPaid)
            throw new DomainException("A számla már fizetve van.");

        invoice.MarkPaid(request.PaymentDate);
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
