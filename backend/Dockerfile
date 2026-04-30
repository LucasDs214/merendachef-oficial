FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY MerendaChef.Api.csproj .
RUN dotnet restore

COPY . .
RUN dotnet build -c Release --no-restore 2>&1
RUN dotnet publish -c Release -o /app/publish --no-build 2>&1

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["dotnet", "MerendaChef.Api.dll"]
