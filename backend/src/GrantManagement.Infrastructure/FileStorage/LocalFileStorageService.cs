using GrantManagement.Domain.Interfaces;

namespace GrantManagement.Infrastructure.FileStorage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public LocalFileStorageService(string basePath)
        => _basePath = basePath;

    public async Task<string> SaveFileAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        var year = DateTime.UtcNow.Year.ToString();
        var uniqueName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var relativePath = Path.Combine(year, uniqueName);
        var fullPath = Path.Combine(_basePath, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        using var dest = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await fileStream.CopyToAsync(dest, ct);

        return relativePath.Replace('\\', '/');
    }

    public Task<Stream> GetFileAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath);
        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteFileAsync(string storagePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, storagePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public bool FileExists(string storagePath)
        => File.Exists(Path.Combine(_basePath, storagePath));
}
