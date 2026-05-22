namespace GrantManagement.Application.Documents.Queries.DownloadDocument;

public record DocumentFileResult(Stream Stream, string ContentType, string FileName);
