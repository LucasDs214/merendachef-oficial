namespace MerendaChef.Api.Services;

public interface IEmailService
{
    Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha);
}

/// <summary>
/// Implementação mock que loga o e-mail no console.
/// Para produção, substitua por MailKit com SMTP real.
/// </summary>
public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;
    private readonly IConfiguration _config;

    public MockEmailService(ILogger<MockEmailService> logger, IConfiguration config)
    {
        _logger = logger; _config = config;
    }

    public Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha)
    {
        _logger.LogInformation(
            "📧 [MOCK EMAIL] Para: {Email} | Assunto: Sua senha temporária MerendaChef\n" +
            "Olá {Nome},\n" +
            "Seu cadastro no MerendaChef foi realizado com sucesso!\n" +
            "Senha temporária: {Senha}\n" +
            "Acesse: http://localhost:3000/login\n" +
            "⚠️ Você deverá alterar sua senha no primeiro acesso.",
            destinatario, nome, senha
        );

        // Para produção com MailKit, descomente:
        /*
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["Email:From"]));
        message.To.Add(MailboxAddress.Parse(destinatario));
        message.Subject = "MerendaChef - Sua senha de acesso";
        message.Body = new TextPart("html") { Text = BuildEmailHtml(nome, senha) };

        using var client = new SmtpClient();
        await client.ConnectAsync(_config["Email:SmtpHost"], int.Parse(_config["Email:SmtpPort"]!), false);
        await client.AuthenticateAsync(_config["Email:User"], _config["Email:Password"]);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
        */

        return Task.CompletedTask;
    }
}
