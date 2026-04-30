namespace MerendaChef.Api.Services;

public interface IEmailService
{
    Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha);
    Task EnviarConvocacaoSegundaFaseAsync(string destinatario, string nome, string nomeReceita, DateTime data, string local);
}

public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;
    private readonly IConfiguration _config;

    public MockEmailService(ILogger<MockEmailService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha)
    {
        _logger.LogInformation(
            "📧 [MOCK EMAIL] Para: {Email} | Assunto: Sua senha temporária MerendaChef\n" +
            "Olá {Nome},\n" +
            "Seu cadastro no MerendaChef foi realizado com sucesso!\n" +
            "Senha temporária: {Senha}\n" +
            "Acesse: http://10.200.15.225:3000/login\n" +
            "⚠️ Você deverá alterar sua senha no primeiro acesso.",
            destinatario, nome, senha
        );
        return Task.CompletedTask;
    }

    public Task EnviarConvocacaoSegundaFaseAsync(string destinatario, string nome, string nomeReceita, DateTime data, string local)
    {
        _logger.LogInformation(
            "📧 [MOCK EMAIL - CONVOCAÇÃO 2ª FASE] Para: {Email}\n" +
            "🏆 Parabéns, {Nome}!\n" +
            "Sua receita '{Receita}' foi selecionada entre as 12 melhores do Concurso Culinário FAETEC 2025!\n\n" +
            "📅 Data e Horário: {Data}\n" +
            "📍 Local: {Local}\n\n" +
            "Compareça com documento de identidade e com antecedência.\n" +
            "Acesse sua inscrição em: http://10.200.15.225:3000/minha-inscricao",
            destinatario, nome, nomeReceita,
            data.ToString("dd/MM/yyyy 'às' HH:mm"), local
        );

        // Para produção com MailKit, descomente e configure:
        /*
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["Email:From"]));
        message.To.Add(MailboxAddress.Parse(destinatario));
        message.Subject = "🏆 MerendaChef — Você foi convocado para a 2ª Fase!";
        message.Body = new TextPart("html")
        {
            Text = $@"
            <h2>Parabéns, {nome}!</h2>
            <p>Sua receita <strong>{nomeReceita}</strong> foi selecionada entre as 12 melhores!</p>
            <p><strong>Data:</strong> {data:dd/MM/yyyy 'às' HH:mm}</p>
            <p><strong>Local:</strong> {local}</p>
            <p>Compareça com documento de identidade.</p>
            <a href='http://10.200.15.225:3000/minha-inscricao'>Ver minha inscrição</a>"
        };
        using var client = new SmtpClient();
        await client.ConnectAsync(_config["Email:SmtpHost"], int.Parse(_config["Email:SmtpPort"]!), false);
        await client.AuthenticateAsync(_config["Email:User"], _config["Email:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
        */

        return Task.CompletedTask;
    }
}
