using GrantManagement.Application.Common.Interfaces;
using MediatR;

namespace GrantManagement.Application.EmailRecords.Commands.DeleteEmailRecord;

public record DeleteEmailRecordCommand(Guid ApplicationId, Guid EmailRecordId)
    : IRequest, IApplicationCommand;
