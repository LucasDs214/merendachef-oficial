using Microsoft.EntityFrameworkCore;
using MerendaChef.Api.Models;

namespace MerendaChef.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Candidato> Candidatos => Set<Candidato>();
    public DbSet<Inscricao> Inscricoes => Set<Inscricao>();
    public DbSet<Ingrediente> Ingredientes => Set<Ingrediente>();
    public DbSet<InscricaoIngrediente> InscricaoIngredientes => Set<InscricaoIngrediente>();
    public DbSet<Admin> Admins => Set<Admin>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Candidato
        mb.Entity<Candidato>(e => {
            e.HasIndex(c => c.Cpf).IsUnique();
            e.HasIndex(c => c.Email).IsUnique();
            e.Property(c => c.Cpf).HasMaxLength(11);
        });

        // Inscricao -> Candidato 1:1
        mb.Entity<Inscricao>(e => {
            e.HasOne(i => i.Candidato)
             .WithOne(c => c.Inscricao)
             .HasForeignKey<Inscricao>(i => i.CandidatoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // InscricaoIngrediente composite PK
        mb.Entity<InscricaoIngrediente>(e => {
            e.HasKey(ii => new { ii.InscricaoId, ii.IngredienteId });
            e.HasOne(ii => ii.Inscricao).WithMany(i => i.Ingredientes).HasForeignKey(ii => ii.InscricaoId);
            e.HasOne(ii => ii.Ingrediente).WithMany().HasForeignKey(ii => ii.IngredienteId);
        });

        // Seed Ingredientes (Anexo I - Insumos do Pregão FAETEC)
        mb.Entity<Ingrediente>().HasData(SeedIngredientes());
    }

    private static List<Ingrediente> SeedIngredientes()
    {
        var list = new List<Ingrediente>();
        int id = 1;

        void Add(string nome, string cat, bool inNatura, string unidade) =>
            list.Add(new Ingrediente { Id = id++, Nome = nome, Categoria = cat, IsInNatura = inNatura, UnidadeMedida = unidade });

        // Grãos e Cereais
        Add("Arroz Branco Tipo 1", "Grãos e Cereais", false, "kg");
        Add("Feijão Carioca Tipo 1", "Grãos e Cereais", false, "kg");
        Add("Feijão Preto Tipo 1", "Grãos e Cereais", false, "kg");
        Add("Milho Verde (grão)", "Grãos e Cereais", true, "kg");
        Add("Fubá de Milho", "Grãos e Cereais", false, "kg");
        Add("Macarrão Espaguete", "Grãos e Cereais", false, "kg");
        Add("Farinha de Mandioca", "Grãos e Cereais", false, "kg");
        Add("Farinha de Trigo", "Grãos e Cereais", false, "kg");

        // Proteínas Animais
        Add("Frango Inteiro Congelado", "Proteínas Animais", false, "kg");
        Add("Sobrecoxa de Frango", "Proteínas Animais", false, "kg");
        Add("Carne Bovina Moída (patinho)", "Proteínas Animais", false, "kg");
        Add("Linguiça de Frango", "Proteínas Animais", false, "kg");
        Add("Ovo de Galinha", "Proteínas Animais", true, "dúzia");
        Add("Peixe (filé de tilápia)", "Proteínas Animais", false, "kg");
        Add("Sardinha em Conserva", "Proteínas Animais", false, "lata");

        // Hortaliças e Verduras (In Natura)
        Add("Alface", "Hortaliças", true, "unidade");
        Add("Tomate", "Hortaliças", true, "kg");
        Add("Cebola", "Hortaliças", true, "kg");
        Add("Alho", "Hortaliças", true, "kg");
        Add("Cenoura", "Hortaliças", true, "kg");
        Add("Beterraba", "Hortaliças", true, "kg");
        Add("Couve-Flor", "Hortaliças", true, "unidade");
        Add("Brócolis", "Hortaliças", true, "kg");
        Add("Chuchu", "Hortaliças", true, "kg");
        Add("Abóbora", "Hortaliças", true, "kg");
        Add("Batata-Doce", "Hortaliças", true, "kg");
        Add("Mandioca / Aipim", "Hortaliças", true, "kg");
        Add("Quiabo", "Hortaliças", true, "kg");
        Add("Jiló", "Hortaliças", true, "kg");
        Add("Berinjela", "Hortaliças", true, "kg");
        Add("Pimentão Verde", "Hortaliças", true, "unidade");
        Add("Espinafre", "Hortaliças", true, "maço");
        Add("Coentro", "Hortaliças", true, "maço");
        Add("Cheiro-Verde (Salsa e Cebolinha)", "Hortaliças", true, "maço");

        // Frutas (In Natura)
        Add("Banana Prata", "Frutas", true, "kg");
        Add("Laranja Pera", "Frutas", true, "kg");
        Add("Mamão Formosa", "Frutas", true, "kg");
        Add("Maçã Gala", "Frutas", true, "kg");
        Add("Limão Taiti", "Frutas", true, "kg");
        Add("Abacaxi", "Frutas", true, "unidade");
        Add("Maracujá", "Frutas", true, "kg");
        Add("Goiaba", "Frutas", true, "kg");

        // Laticínios e Derivados
        Add("Leite UHT Integral", "Laticínios", false, "litro");
        Add("Queijo Mussarela Fatiado", "Laticínios", false, "kg");
        Add("Queijo Prato", "Laticínios", false, "kg");
        Add("Iogurte Natural", "Laticínios", false, "kg");
        Add("Manteiga com Sal", "Laticínios", false, "kg");

        // Temperos e Condimentos
        Add("Óleo de Soja", "Temperos e Condimentos", false, "litro");
        Add("Azeite de Oliva Extra Virgem", "Temperos e Condimentos", false, "litro");
        Add("Sal Refinado", "Temperos e Condimentos", false, "kg");
        Add("Açúcar Cristal", "Temperos e Condimentos", false, "kg");
        Add("Vinagre de Álcool", "Temperos e Condimentos", false, "litro");
        Add("Extrato de Tomate", "Temperos e Condimentos", false, "lata");
        Add("Molho de Pimenta", "Temperos e Condimentos", false, "frasco");
        Add("Louro (folha)", "Temperos e Condimentos", true, "maço");
        Add("Pimenta-do-Reino Preta (pó)", "Temperos e Condimentos", false, "g");
        Add("Cominho (pó)", "Temperos e Condimentos", false, "g");
        Add("Páprica Defumada", "Temperos e Condimentos", false, "g");
        Add("Açafrão da Terra (cúrcuma)", "Temperos e Condimentos", false, "g");
        Add("Canela em Pó", "Temperos e Condimentos", false, "g");

        // Leguminosas
        Add("Lentilha", "Leguminosas", false, "kg");
        Add("Grão-de-Bico", "Leguminosas", false, "kg");
        Add("Ervilha em Conserva", "Leguminosas", false, "lata");
        Add("Milho Verde em Conserva", "Leguminosas", false, "lata");

        return list;
    }
}
