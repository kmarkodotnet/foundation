FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/GrantManagement.API/GrantManagement.API.csproj", "src/GrantManagement.API/"]
COPY ["src/GrantManagement.Application/GrantManagement.Application.csproj", "src/GrantManagement.Application/"]
COPY ["src/GrantManagement.Domain/GrantManagement.Domain.csproj", "src/GrantManagement.Domain/"]
COPY ["src/GrantManagement.Infrastructure/GrantManagement.Infrastructure.csproj", "src/GrantManagement.Infrastructure/"]

RUN dotnet restore "src/GrantManagement.API/GrantManagement.API.csproj"

COPY . .
RUN dotnet publish "src/GrantManagement.API/GrantManagement.API.csproj" \
    -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "GrantManagement.API.dll"]
