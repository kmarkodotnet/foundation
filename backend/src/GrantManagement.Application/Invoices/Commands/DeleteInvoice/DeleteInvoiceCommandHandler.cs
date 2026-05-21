using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invoices.Commands.DeleteInvoice;

public class DeleteInvoiceCommandHandler : IRequestHandler<DeleteInvoiceCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteInvoiceCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.ApplicationId == request.ApplicationId && i.Id == request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Invoice), request.InvoiceId);

        invoice.SoftDelete();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
