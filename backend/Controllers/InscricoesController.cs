using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MerendaChef.Api.Data;
using MerendaChef.Api.Models;

namespace MerendaChef.Api.Controllers;

[ApiController]
[Route("api/inscricoes")]
public class InscricoesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public InscricoesController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db; _env = env;
    }

    [HttpPost]
    [Authorize(Roles = "Candidato")]
    [RequestSizeLimit(20_000_000)] // 20MB
    public async Task<IActionResult> Inscrever([FromForm] InscricaoFormDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Atualizar dados funcionais do candidato
        var candidato = await _db.Candidatos.FindAsync(userId);
        if (candidato == null) return Unauthorized();

        // Verificar unicidade (1 inscrição por CPF)
        if (await _db.Inscricoes.AnyAsync(i => i.CandidatoId == userId))
            return Conflict(new { error = "Você já possui uma inscrição cadastrada." });

        candidato.UnidadeEscolar = dto.UnidadeEscolar;
        candidato.NomeDiretor = dto.NomeDiretor;
        candidato.Matricula = dto.Matricula;
        candidato.Cargo = dto.Cargo;

        // Salvar comprovante (obrigatório)
        var comprovanteNome = await SalvarArquivo(dto.ComprovanteVinculo, userId);
        if (comprovanteNome == null) return BadRequest(new { error = "Comprovante de vínculo é obrigatório." });

        // Salvar foto da receita (opcional)
        string? fotoNome = dto.FotoReceita != null
            ? await SalvarArquivo(dto.FotoReceita, userId)
            : null;

        var inscricao = new Inscricao
        {
            CandidatoId = userId,
            NomeReceita = dto.NomeReceita,
            Descricao = dto.Descricao,
            ComprovanteVinculo = comprovanteNome!,
            FotoReceita = fotoNome,
            AceitouLgpd = dto.AceitouLgpd,
            AutorizouUsoImagem = dto.AutorizouUsoImagem,
            Status = StatusInscricao.Pendente,
            Ingredientes = dto.IngredienteIds.Select(id => new InscricaoIngrediente
            {
                IngredienteId = id,
                Quantidade = ""
            }).ToList()
        };

        _db.Inscricoes.Add(inscricao);
        await _db.SaveChangesAsync();

        return Ok(new { id = inscricao.Id, message = "Inscrição realizada com sucesso!" });
    }

    [HttpGet("minha")]
    [Authorize(Roles = "Candidato")]
    public async Task<IActionResult> MinhaInscricao()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inscricao = await _db.Inscricoes
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .FirstOrDefaultAsync(i => i.CandidatoId == userId);
    
        if (inscricao == null) return NotFound(new { error = "Nenhuma inscrição encontrada." });
    
        return Ok(new {
            id = inscricao.Id,
            nomeReceita = inscricao.NomeReceita,
            descricao = inscricao.Descricao,
            fotoReceita = inscricao.FotoReceita,
            status = inscricao.Status.ToString(),
            motivoEliminacao = inscricao.MotivoEliminacao,
            dataSegundaFase = inscricao.DataSegundaFase,
            localSegundaFase = inscricao.LocalSegundaFase,
            convocadoEm = inscricao.ConvocadoEm,
            ingredientes = inscricao.Ingredientes.Select(ii => new {
                ii.Ingrediente.Id,
                ii.Ingrediente.Nome,
                ii.Ingrediente.IsInNatura
            }),
            criadaEm = inscricao.CriadaEm
        });
    }

    // Fase classificatória - anônimo
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

    [HttpGet("ingredientes")]
    public async Task<IActionResult> ListarIngredientes()
    {
        var ingredientes = await _db.Ingredientes
            .OrderBy(i => i.Categoria).ThenBy(i => i.Nome)
            .Select(i => new { i.Id, i.Nome, i.Categoria, i.IsInNatura, i.UnidadeMedida })
            .ToListAsync();
        return Ok(ingredientes);
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

    private static object MapToDto(Inscricao i) => new
    {
        id = i.Id,
        nomeReceita = i.NomeReceita,
        descricao = i.Descricao,
        status = i.Status.ToString(),
        motivoEliminacao = i.MotivoEliminacao,
        ingredientes = i.Ingredientes.Select(ii => new { ii.Ingrediente.Id, ii.Ingrediente.Nome }),
        criadaEm = i.CriadaEm
    };
}

public class InscricaoFormDto
{
    // Passo 1
    public string UnidadeEscolar { get; set; } = string.Empty;
    public string NomeDiretor { get; set; } = string.Empty;
    public string Matricula { get; set; } = string.Empty;
    public string Cargo { get; set; } = string.Empty;

    // Passo 2
    public IFormFile? ComprovanteVinculo { get; set; }

    // Passo 3
    public string NomeReceita { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public IFormFile? FotoReceita { get; set; }

    // Passo 4
    public List<int> IngredienteIds { get; set; } = new();

    // Passo 5
    public bool AceitouLgpd { get; set; }
    public bool AutorizouUsoImagem { get; set; }
}
