namespace MerendaChef.Api.Models;

public class Candidato
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty; // stored as digits only
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public bool PrimeiroAcesso { get; set; } = true;
    public string UnidadeEscolar { get; set; } = string.Empty;
    public string NomeDiretor { get; set; } = string.Empty;
    public string Matricula { get; set; } = string.Empty;
    public string Cargo { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public Inscricao? Inscricao { get; set; }
}

public class Inscricao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CandidatoId { get; set; }
    public Candidato Candidato { get; set; } = null!;

    // Receita
    public string NomeReceita { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? FotoReceita { get; set; } // file path
    public string ComprovanteVinculo { get; set; } = string.Empty; // file path

    // Termos
    public bool AceitouLgpd { get; set; }
    public bool AutorizouUsoImagem { get; set; }

    // Status
    public StatusInscricao Status { get; set; } = StatusInscricao.Pendente;
    public string? MotivoEliminacao { get; set; }

    // Pontuação (Quadro 1)
    public decimal? NotaViabilidade { get; set; }       // 0-50 (peso aplicado)
    public decimal? NotaCriatividade { get; set; }
    public decimal? NotaCulturaRegional { get; set; }
    public decimal? NotaAlimentosInNatura { get; set; }
    public decimal? NotaTotal { get; set; }

    public DateTime CriadaEm { get; set; } = DateTime.UtcNow;
    public DateTime? AtualizadaEm { get; set; }

    public ICollection<InscricaoIngrediente> Ingredientes { get; set; } = new List<InscricaoIngrediente>();

    // Novos campos para segunda fase
    public DateTime? DataSegundaFase { get; set; }
    public string? LocalSegundaFase { get; set; }
    public DateTime? ConvocadoEm { get; set; }
}

public enum StatusInscricao
{
    Pendente,
    Habilitada,
    Eliminada
    ConvocadoSegundaFase
}

public class Ingrediente
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty; // Grãos, Carnes, Hortaliças, etc.
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
