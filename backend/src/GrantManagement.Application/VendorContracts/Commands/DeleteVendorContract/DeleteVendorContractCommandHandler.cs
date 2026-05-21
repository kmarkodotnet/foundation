using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GrantApp = GrantManagement.Domain.Entities.Application;

namespace GrantManagement.Application.VendorContracts.Commands.DeleteVendorContract;

public class DeleteVendorContractCommandHandler : IRequestHandler<DeleteVendorContractCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteVendorContractCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteVendorContractCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.VendorContracts)
            .Include(a => a.Invoices)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(GrantApp), request.ApplicationId);

        // Domain method checks for linked invoices and throws DomainException if any exist
        application.RemoveVendorContract(request.ContractId);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
