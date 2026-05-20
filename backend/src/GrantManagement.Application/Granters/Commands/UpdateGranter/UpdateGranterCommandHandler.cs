using AutoMapper;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Granters.Commands.UpdateGranter;

public class UpdateGranterCommandHandler : IRequestHandler<UpdateGranterCommand, GranterDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateGranterCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<GranterDto> Handle(
        UpdateGranterCommand request,
        CancellationToken cancellationToken)
    {
        var granter = await _context.Granters
            .FirstOrDefaultAsync(g => g.Id == request.GranterId, cancellationToken)
            ?? throw new NotFoundException(nameof(Granter), request.GranterId);

        var nameConflict = await _context.Granters
            .AnyAsync(g => g.Name == request.Name.Trim() && g.Id != request.GranterId, cancellationToken);

        if (nameConflict)
            throw new DomainException("Ez a pályáztató már szerepel a rendszerben.");

        var contact = new ContactInfo(request.PhoneNumber, request.Email);
        granter.Update(request.Name, request.Description, contact);

        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<GranterDto>(granter);
    }
}
