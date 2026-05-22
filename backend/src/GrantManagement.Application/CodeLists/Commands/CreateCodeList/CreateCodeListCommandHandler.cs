using GrantManagement.Application.CodeLists.DTOs;
using GrantManagement.Application.Common.Interfaces;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Application.CodeLists.Commands.CreateCodeList;

public class CreateCodeListCommandHandler : IRequestHandler<CreateCodeListCommand, CodeListDto>
{
    private readonly IApplicationDbContext _context;

    public CreateCodeListCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CodeListDto> Handle(CreateCodeListCommand request, CancellationToken cancellationToken)
    {
        var nameExists = await _context.CodeLists
            .AnyAsync(cl => cl.Name == request.Name.Trim(), cancellationToken);

        if (nameExists)
            throw new DomainException("Ilyen nevű kódszótár már létezik.");

        var codeList = CodeList.Create(request.Name.Trim(), request.Description, isSystem: false);

        _context.CodeLists.Add(codeList);
        await _context.SaveChangesAsync(cancellationToken);

        return new CodeListDto
        {
            Id = codeList.Id,
            Name = codeList.Name,
            Description = codeList.Description,
            IsSystem = codeList.IsSystem,
            ItemCount = 0,
            CreatedAt = codeList.CreatedAt,
            UpdatedAt = codeList.UpdatedAt,
        };
    }
}
