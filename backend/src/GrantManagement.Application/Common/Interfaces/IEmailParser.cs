using GrantManagement.Application.EmailRecords.DTOs;

namespace GrantManagement.Application.Common.Interfaces;

public interface IEmailParser
{
    EmlPreviewDto? Parse(Stream stream);
}
