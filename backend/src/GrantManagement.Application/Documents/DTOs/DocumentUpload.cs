namespace GrantManagement.Application.Documents.DTOs;

/// <summary>
/// Abstraction over an uploaded file to keep the Application layer free of ASP.NET Core dependencies.
/// </summary>
public record DocumentUpload(Stream Stream, string FileName, string ContentType, long Length);
