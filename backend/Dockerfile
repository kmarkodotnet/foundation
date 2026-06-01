# syntax=docker/dockerfile:1
# ARM64 (Raspberry Pi) + AMD64 kompatibilis, .NET 8

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG TARGETARCH
WORKDIR /src

# Restore réteg külön – Docker cache-eli, ha a .csproj nem változik
COPY GrantManagement.sln ./
COPY src/GrantManagement.API/GrantManagement.API.csproj                       src/GrantManagement.API/
COPY src/GrantManagement.Application/GrantManagement.Application.csproj       src/GrantManagement.Application/
COPY src/GrantManagement.Domain/GrantManagement.Domain.csproj                 src/GrantManagement.Domain/
COPY src/GrantManagement.Infrastructure/GrantManagement.Infrastructure.csproj src/GrantManagement.Infrastructure/

RUN dotnet restore src/GrantManagement.API/GrantManagement.API.csproj -a $TARGETARCH

COPY . .

RUN dotnet publish src/GrantManagement.API/GrantManagement.API.csproj \
    -c Release \
    -a $TARGETARCH \
    --no-restore \
    -o /app/publish

# -------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Feltöltési mappa előre létrehozva (volume mount előtt is létezzen)
RUN mkdir -p data/uploads

# .NET 8 base image-ben alapértelmezett: ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "GrantManagement.API.dll"]
