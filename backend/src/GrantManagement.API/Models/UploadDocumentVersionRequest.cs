using Microsoft.AspNetCore.Http;

namespace GrantManagement.API.Models;

public class UploadDocumentVersionRequest
{
    public string? DisplayName { get; set; }
    public IFormFile File { get; set; } = null!;
}
