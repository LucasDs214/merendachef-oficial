using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MerendaChef.Api.Data;
using MerendaChef.Api.Models;
using MerendaChef.Api.Services;

namespace MerendaChef.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;

    public AdminController(AppDbContext db, IEmailService email)
    {
        _db = db;
        _email = email;
    }

    [HttpGet("inscricoes")]
    public async Task<IActionResult> ListarInscricoes([FromQuery] StatusInscricao? status)
    {
        var query = _db.Inscricoes
            .Include(i => i.Candidato)
            .Include(i => i.Ingredientes).ThenInclude(ii => ii.Ingrediente)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(i => i.Status == status.Value);

        var inscricoes = await query.OrderBy(i => i.CriadaEm).ToListAsync();

        return Ok(inscricoes.Select(i => new
        {
            id = i.Id,
            candidato = new
            {
                nome = i.Candidato.Nome,
                cpf = MaskCpf(i.Candidato.Cpf),
                email = i.Candidato.Email,
                unidade = i.Candidato.UnidadeEscolar,
                diretor = i.Candidato.NomeDiretor,
                matricula = i.Candidato.Matricula,
                cargo = i.Candidato.Cargo
            },
            receita = new
            {
                nome = i.NomeReceita,
                descricao = i.Descricao,
                foto = i.FotoReceita,
                comprovante = i.ComprovanteVinculo
            },
            ingredientes = i.Ingredientes.Select(ii => new
            {
                ii.Ingrediente.Id,
                ii.Ingrediente.Nome,
                ii.Ingrediente.Categoria,
                ii.Ingrediente.IsInNatura
            }),
            status = i.Status.ToString(),
            motivoEliminacao = i.MotivoEliminacao,
            notas = new
            {
                viabilidade = i.NotaViabilidade,
                criatividade = i.NotaCriatividade,
                culturaRegional = i.NotaCulturaRegional,
                alimentosInNatura = i.NotaAlimentosInNatura,
                total = i.NotaTotal
            },
            criadaEm = i.CriadaEm
        }));
    }

    [HttpPatch("inscricoes/{id:guid}/habilitar")]
    public async Task<IActionResult> Habilitar(Guid id)
    {
        var inscricao = await _db.Inscricoes.FindAsync(id);
        if (inscricao == null) return NotFound();
        inscricao.Status = StatusInscricao.Habilitada;
        inscricao.MotivoEliminacao = null;
        inscricao.AtualizadaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Inscrição habilitada." });
    }

    [HttpPatch("inscricoes/{id:guid}/eliminar")]
    public async Task<IActionResult> Eliminar(Guid id, [FromBody] EliminarDto dto)
    {
        var inscricao = await _db.Inscricoes.FindAsync(id);
        if (inscricao == null) return NotFound();
        inscricao.Status = StatusInscricao.Eliminada;
        inscricao.MotivoEliminacao = dto.Motivo;
        inscricao.AtualizadaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Inscrição eliminada." });
    }

    [HttpPatch("inscricoes/{id:guid}/notas")]
    public async Task<IActionResult> LancarNotas(Guid id, [FromBody] NotasDto dto)
    {
        var inscricao = await _db.Inscricoes.FindAsync(id);
        if (inscricao == null) return NotFound();
        if (inscricao.Status != StatusInscricao.Habilitada)
            return BadRequest(new { error = "Apenas inscrições habilitadas podem ser pontuadas." });

        if (!ValidarNota(dto.Viabilidade) || !ValidarNota(dto.Criatividade) ||
            !ValidarNota(dto.CulturaRegional) || !ValidarNota(dto.AlimentosInNatura))
            return BadRequest(new { error = "Notas devem estar entre 0 e 50." });

        inscricao.NotaViabilidade = dto.Viabilidade;
        inscricao.NotaCriatividade = dto.Criatividade;
        inscricao.NotaCulturaRegional = dto.CulturaRegional;
        inscricao.NotaAlimentosInNatura = dto.AlimentosInNatura;
        inscricao.NotaTotal = dto.Viabilidade + dto.Criatividade + dto.CulturaRegional + dto.AlimentosInNatura;
        inscricao.AtualizadaEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { notaTotal = inscricao.NotaTotal });
    }

    [HttpGet("ranking")]
    public async Task<IActionResult> Ranking()
    {
        var inscricoes = await _db.Inscricoes
            .Include(i => i.Candidato)
            .Where(i => i.Status == StatusInscricao.Habilitada && i.NotaTotal.HasValue)
            .ToListAsync();

        var rankingOrdenado = inscricoes
            .OrderByDescending(i => i.NotaTotal)
            .ThenByDescending(i => i.NotaAlimentosInNatura)
            .ThenByDescending(i => i.NotaViabilidade)
            .ThenByDescending(i => i.NotaCriatividade)
            .ThenByDescending(i => i.NotaCulturaRegional)
            .Select((i, idx) => new
            {
                posicao = idx + 1,
                candidato = i.Candidato.Nome,
                nomeReceita = i.NomeReceita,
                notas = new
                {
                    viabilidade = i.NotaViabilidade,
                    criatividade = i.NotaCriatividade,
                    culturaRegional = i.NotaCulturaRegional,
                    alimentosInNatura = i.NotaAlimentosInNatura,
                    total = i.NotaTotal
                }
            })
            .ToList();

        return Ok(rankingOrdenado);
    }

    [HttpPatch("inscricoes/{id:guid}/convocar")]
    public async Task<IActionResult> Convocar(Guid id, [FromBody] ConvocarDto dto)
    {
        var inscricao = await _db.Inscricoes
            .Include(i => i.Candidato)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inscricao == null) return NotFound();
        if (inscricao.Status != StatusInscricao.Habilitada)
            return BadRequest(new { error = "Apenas inscrições habilitadas podem ser convocadas." });

        inscricao.Status = StatusInscricao.ConvocadoSegundaFase;
        inscricao.DataSegundaFase = dto.DataSegundaFase;
        inscricao.DataSegundaFase = DateTime.SpecifyKind(dto.DataSegundaFase, DateTimeKind.Utc);
        inscricao.ConvocadoEm = DateTime.UtcNow;
        inscricao.AtualizadaEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _email.EnviarConvocacaoSegundaFaseAsync(
            inscricao.Candidato.Email,
            inscricao.Candidato.Nome,
            inscricao.NomeReceita,
            dto.DataSegundaFase,
            dto.LocalSegundaFase
        );

        return Ok(new { message = "Candidato convocado com sucesso!" });
    }

    [HttpPost("admins")]
    public async Task<IActionResult> CriarAdmin([FromBody] CriarAdminDto dto)
    {
        if (await _db.Admins.AnyAsync(a => a.Email == dto.Email))
            return Conflict(new { error = "E-mail já cadastrado." });

        var admin = new Admin
        {
            Nome = dto.Nome,
            Email = dto.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha)
        };
        _db.Admins.Add(admin);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Admin criado com sucesso!", id = admin.Id });
    }

    [HttpGet("admins")]
    public async Task<IActionResult> ListarAdmins()
    {
        var admins = await _db.Admins
            .Select(a => new { a.Id, a.Nome, a.Email, a.CriadoEm })
            .ToListAsync();
        return Ok(admins);
    }

    private static bool ValidarNota(decimal nota) => nota >= 0 && nota <= 50;

    private static string MaskCpf(string cpf) =>
        cpf.Length == 11 ? $"{cpf[..3]}.{cpf[3..6]}.{cpf[6..9]}-{cpf[9..]}" : cpf;
}

public record CriarAdminDto(string Nome, string Email, string Senha);
public record ConvocarDto(DateTime DataSegundaFase, string LocalSegundaFase);
public record EliminarDto(string Motivo);
public record NotasDto(decimal Viabilidade, decimal Criatividade, decimal CulturaRegional, decimal AlimentosInNatura);
