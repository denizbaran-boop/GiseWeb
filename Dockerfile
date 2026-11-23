# Gişe Web — container image (used by Render; works with any Docker host)

# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Gise.Web/Gise.Web.csproj src/Gise.Web/
RUN dotnet restore src/Gise.Web/Gise.Web.csproj
COPY src/Gise.Web/ src/Gise.Web/
RUN dotnet publish src/Gise.Web/Gise.Web.csproj -c Release -o /app --no-restore

# ---- run ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# The database and uploads must be writable by the non-root "app" user of the image.
RUN mkdir -p /app/data /app/wwwroot/uploads && chown -R $APP_UID /app/data /app/wwwroot/uploads
USER $APP_UID
ENV ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Gise="Data Source=/app/data/gise.db" \
    PORT=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Gise.Web.dll"]
