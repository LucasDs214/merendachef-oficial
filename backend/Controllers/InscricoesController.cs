using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MerendaChef.Api.Data;
using MerendaChef.Api.Models;
using MerendaChef.Api.Services;

namespace MerendaChef.Api.Controllers;

[ApiController]
[Route("api/inscricoes")]
public class InscricoesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _email;

    public InscricoesController(AppDbContext db, IWebHostEnvironment env, IEmailService email)
    {
        _db = db; _env = env; _email = email;
    }

    [HttpPost]
    [Authorize(Roles = "Candidato")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Inscrever([FromForm] InscricaoFormDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var candidato = await _db.Candidatos.FindAsync(userId);
        if (candidato == null) return Unauthorized();

        if (await _db.Inscricoes.AnyAsync(i => i.CandidatoId == userId))
            return Conflict(new { error = "Você já possui uma inscrição cadastrada." });

        candidato.UnidadeEscolar = dto.UnidadeEscolar;
        candidato.NomeDiretor = dto.NomeDiretor;
        candidato.Matricula = dto.Matricula;
        candidato.Cargo = dto.Cargo;
        candidato.Telefone = dto.Telefone;
        candidato.AceitouTermosUso = dto.AceitouTermosUso;

        var comprovanteNome = await SalvarArquivo(dto.ComprovanteVinculo, userId);
        if (comprovanteNome == null) return BadRequest(new { error = "Comprovante de vínculo é obrigatório." });

        string? fotoNome = dto.FotoReceita != null
            ? await SalvarArquivo(dto.FotoReceita, userId)
            : null;

        var inscricao = new Inscricao
        {
            CandidatoId = userId,
            NomeReceita = dto.NomeReceita,
            Descricao = dto.Descricao,
            ModoPreparo = dto.ModoPreparo,
            ComprovanteVinculo = comprovanteNome!,
            FotoReceita = fotoNome,
            AceitouLgpd = dto.AceitouLgpd,
            AutorizouUsoImagem = dto.AutorizouUsoImagem,
            Status = StatusInscricao.Pendente,
            Ingredientes = dto.Ingredientes.Select(i => new InscricaoIngrediente
            {
                IngredienteId = i.Id,
                Quantidade = i.Quantidade
            }).ToList()
        };

        _db.Inscricoes.Add(inscricao);
        await _db.SaveChangesAsync();

        // Gerar hash único de confirmação
        var hash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes($"{candidato.Cpf}{inscricao.Id}{DateTime.UtcNow}")
            )
        )[..12].ToUpper();

        inscricao.HashInscricao = hash;
        inscricao.DataConfirmacao = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _email.EnviarComprovanteInscricaoAsync(
            candidato.Email,
            candidato.Nome,
            dto.NomeReceita,
            hash,
            inscricao.CriadaEm
        );

        return Ok(new { id = inscricao.Id, hash, message = "Inscrição realizada com sucesso!" });
    }

    [HttpGet("minha")]
    [Authorize(Roles = "Candidato")]
    public async Task<IActionResult> MinhaInscricao()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inscricao = await _db.Inscricoes
            .Include(i => i.Candidato)
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .FirstOrDefaultAsync(i => i.CandidatoId == userId);
    
        if (inscricao == null) return NotFound(new { error = "Nenhuma inscrição encontrada." });
    
        var c = inscricao.Candidato;
        return Ok(new {
            id = inscricao.Id,
            candidato = new {
                nome = c.Nome,
                cpf = c.Cpf.Length == 11 ? $"{c.Cpf[..3]}.{c.Cpf[3..6]}.{c.Cpf[6..9]}-{c.Cpf[9..]}" : c.Cpf,
                email = c.Email,
                telefone = c.Telefone,
                unidadeEscolar = c.UnidadeEscolar,
                nomeDiretor = c.NomeDiretor,
                matricula = c.Matricula,
                cargo = c.Cargo
            },
            nomeReceita = inscricao.NomeReceita,
            descricao = inscricao.Descricao,
            modoPreparo = inscricao.ModoPreparo,
            fotoReceita = inscricao.FotoReceita,
            comprovanteVinculo = inscricao.ComprovanteVinculo,
            hashInscricao = inscricao.HashInscricao,
            dataConfirmacao = inscricao.DataConfirmacao,
            status = inscricao.Status.ToString(),
            motivoEliminacao = inscricao.MotivoEliminacao,
            dataSegundaFase = inscricao.DataSegundaFase,
            localSegundaFase = inscricao.LocalSegundaFase,
            convocadoEm = inscricao.ConvocadoEm,
            ingredientes = inscricao.Ingredientes.Select(ii => new {
                ii.Ingrediente.Id,
                ii.Ingrediente.Nome,
                ii.Ingrediente.IsInNatura,
                ii.Quantidade
            }),
            criadaEm = inscricao.CriadaEm
        });
    }

    // Endpoint público — lista ingredientes para consulta antes do login
    [HttpGet("ingredientes")]
    public async Task<IActionResult> ListarIngredientes()
    {
        var ingredientes = await _db.Ingredientes
            .OrderBy(i => i.Categoria).ThenBy(i => i.Nome)
            .Select(i => new { i.Id, i.Nome, i.Categoria, i.IsInNatura, i.UnidadeMedida })
            .ToListAsync();
        return Ok(ingredientes);
    }

    [HttpGet("habilitadas")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ListarHabilitadas()
    {
        var inscricoes = await _db.Inscricoes
            .Where(i => i.Status == StatusInscricao.Habilitada)
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .Select(i => new
            {
                id = i.Id,
                nomeReceita = i.NomeReceita,
                descricao = i.Descricao,
                fotoReceita = i.FotoReceita,
                ingredientes = i.Ingredientes.Select(ii => ii.Ingrediente.Nome),
                notaTotal = i.NotaTotal
            })
            .ToListAsync();
        return Ok(inscricoes);
    }

    private async Task<string?> SalvarArquivo(IFormFile? file, Guid userId)
    {
        if (file == null) return null;
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
        if (!allowed.Contains(ext)) return null;

        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", userId.ToString());
        Directory.CreateDirectory(uploadsDir);

        var nome = $"{Guid.NewGuid()}{ext}";
        var path = Path.Combine(uploadsDir, nome);
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        return $"{userId}/{nome}";
    }
}

// ── DTOs ──────────────────────────────────────────────────────

public class InscricaoFormDto
{
    // Passo 1
    public string UnidadeEscolar { get; set; } = string.Empty;
    public string NomeDiretor { get; set; } = string.Empty;
    public string Matricula { get; set; } = string.Empty;
    public string Cargo { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;

    // Passo 2
    public IFormFile? ComprovanteVinculo { get; set; }

    // Passo 3
    public string NomeReceita { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string ModoPreparo { get; set; } = string.Empty;
    public IFormFile? FotoReceita { get; set; }

    // Passo 4 — ingredientes com quantidade
    public List<IngredienteItemDto> Ingredientes { get; set; } = new();

    // Passo 5
    public bool AceitouLgpd { get; set; }
    public bool AutorizouUsoImagem { get; set; }
    public bool AceitouTermosUso { get; set; }
}

public class IngredienteItemDto
{
    public int Id { get; set; }
    public string Quantidade { get; set; } = string.Empty;
}
