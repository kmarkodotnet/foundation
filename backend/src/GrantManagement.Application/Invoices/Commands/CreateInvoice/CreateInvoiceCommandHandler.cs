using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Invoices.DTOs;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Invoices.Commands.CreateInvoice;

public class CreateInvoiceCommandHandler : IRequestHandler<CreateInvoiceCommand, InvoiceDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateInvoiceCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<InvoiceDto> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException("Application", request.ApplicationId);

        if (application.Status != ApplicationStatus.Won)
            throw new DomainException("Számla csak nyert pályázathoz rögzíthető.");

        var invoice = Domain.Entities.Invoice.Create(
            request.ApplicationId,
            request.SupplierName,
            request.InvoiceNumber,
            request.IssueDate,
            request.Amount,
            request.IsPaid,
            request.PaymentDate,
            _currentUser.UserId,
            request.VendorContractId,
            request.BudgetItemId,
            request.Notes);

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(invoice);
    }

    private static InvoiceDto MapToDto(Domain.Entities.Invoice invoice) => new()
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
