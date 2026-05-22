using GrantManagement.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace GrantManagement.API.Models;

public class UploadDocumentRequest
{
    public Guid? WorkflowStepId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string? DisplayName { get; set; }
    public IFormFile File { get; set; } = null!;
}
