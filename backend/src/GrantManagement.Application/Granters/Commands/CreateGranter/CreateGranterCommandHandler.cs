using AutoMapper;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Application.Granters.DTOs;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.Granters.Commands.CreateGranter;

public class CreateGranterCommandHandler : IRequestHandler<CreateGranterCommand, GranterDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateGranterCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<GranterDto> Handle(
        CreateGranterCommand request,
        CancellationToken cancellationToken)
    {
        var nameExists = await _context.Granters
            .AnyAsync(g => g.Name == request.Name.Trim(), cancellationToken);

        if (nameExists)
            throw new DomainException("Ez a pályáztató már szerepel a rendszerben.");

        var contact = new ContactInfo(request.PhoneNumber, request.Email);
        var granter = Granter.Create(request.Name, request.Description, contact);

        _context.Granters.Add(granter);
        await _context.SaveChangesAsync(cancellationToken);

        return _mapper.Map<GranterDto>(granter);
    }
}
