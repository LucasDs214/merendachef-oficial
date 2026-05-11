namespace MerendaChef.Api.Models;

public class Candidato
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public bool PrimeiroAcesso { get; set; } = true;
    public string UnidadeEscolar { get; set; } = string.Empty;
    public string NomeDiretor { get; set; } = string.Empty;
    public string Matricula { get; set; } = string.Empty;
    public string Cargo { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;        // novo
    public bool AceitouTermosUso { get; set; }                  // novo
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public Inscricao? Inscricao { get; set; }
}

public class Inscricao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CandidatoId { get; set; }
    public Candidato Candidato { get; set; } = null!;

    public string NomeReceita { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string ModoPreparo { get; set; } = string.Empty;     // novo
    public string? FotoReceita { get; set; }
    public string ComprovanteVinculo { get; set; } = string.Empty;

    public bool AceitouLgpd { get; set; }
    public bool AutorizouUsoImagem { get; set; }

    public StatusInscricao Status { get; set; } = StatusInscricao.Pendente;
    public string? MotivoEliminacao { get; set; }
    public string? HashInscricao { get; set; }                  // novo
    public DateTime? DataConfirmacao { get; set; }              // novo

    public decimal? NotaViabilidade { get; set; }
    public decimal? NotaCriatividade { get; set; }
    public decimal? NotaCulturaRegional { get; set; }
    public decimal? NotaAlimentosInNatura { get; set; }
    public decimal? NotaTotal { get; set; }

    public DateTime CriadaEm { get; set; } = DateTime.UtcNow;
    public DateTime? AtualizadaEm { get; set; }

    public DateTime? DataSegundaFase { get; set; }
    public string? LocalSegundaFase { get; set; }
    public DateTime? ConvocadoEm { get; set; }

    public ICollection<InscricaoIngrediente> Ingredientes { get; set; } = new List<InscricaoIngrediente>();
}

public enum StatusInscricao
{
    Pendente,
    Habilitada,
    Eliminada,
    ConvocadoSegundaFase
}

public class Ingrediente
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public bool IsInNatura { get; set; }
    public string UnidadeMedida { get; set; } = string.Empty;
}

public class InscricaoIngrediente
{
    public Guid InscricaoId { get; set; }
    public Inscricao Inscricao { get; set; } = null!;
    public int IngredienteId { get; set; }
    public Ingrediente Ingrediente { get; set; } = null!;
    public string Quantidade { get; set; } = string.Empty;
}

public class Admin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
