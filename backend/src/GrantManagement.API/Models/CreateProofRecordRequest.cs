using Microsoft.AspNetCore.Http;

namespace GrantManagement.API.Models;

public class CreateProofRecordRequest
{
    public string ProofType { get; set; } = null!;
    public DateOnly EventDate { get; set; }
    public string? Notes { get; set; }
    public IList<IFormFile>? Photos { get; set; }
}
