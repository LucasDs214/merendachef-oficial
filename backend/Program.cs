using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MerendaChef.Api.Data;
using MerendaChef.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Auth JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt => {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IEmailService, MockEmailService>();

// CORS — origens via variável de ambiente (seguro para produção pública)
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins)
     .AllowAnyHeader()
     .AllowAnyMethod()));

var app = builder.Build();

// Auto-migrate + seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Admins.Any())
    {
        db.Admins.Add(new MerendaChef.Api.Models.Admin
        {
            Nome = "Administrador FAETEC",
            Email = "admin@faetec.rj.gov.br",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("Admin@2025!")
        });
        db.SaveChanges();
        Console.WriteLine("✅ Admin padrão criado: admin@faetec.rj.gov.br / Admin@2025!");
    }
}

//comentado por hora para testes com swagger
/*if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}*/

app.UseSwagger();
    app.UseSwaggerUI();

app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Servir uploads
app.MapGet("/uploads/{userId}/{fileName}", (string userId, string fileName, IWebHostEnvironment env) => {
    var path = Path.Combine(env.ContentRootPath, "uploads", userId, fileName);
    return File.Exists(path) ? Results.File(path) : Results.NotFound();
}).RequireAuthorization();

app.Run();
