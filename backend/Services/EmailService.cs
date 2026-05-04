namespace MerendaChef.Api.Services;

public interface IEmailService
{
    Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha);
    Task EnviarConvocacaoSegundaFaseAsync(string destinatario, string nome, string nomeReceita, DateTime data, string local);
}

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private async Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
    {
        var host = _config["Email:SmtpHost"];
        var port = int.Parse(_config["Email:SmtpPort"] ?? "587");
        var user = _config["Email:User"];
        var pass = _config["Email:Password"];
        var from = _config["Email:From"];

        using var client = new MailKit.Net.Smtp.SmtpClient();
        await client.ConnectAsync(host, port, false);
        await client.AuthenticateAsync(user, pass);

        var message = new MimeKit.MimeMessage();
        message.From.Add(MimeKit.MailboxAddress.Parse(from));
        message.To.Add(MimeKit.MailboxAddress.Parse(destinatario));
        message.Subject = assunto;
        message.Body = new MimeKit.TextPart("html") { Text = corpoHtml };

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("✅ E-mail enviado para {Email}: {Assunto}", destinatario, assunto);
    }

    public async Task EnviarSenhaTemporariaAsync(string destinatario, string nome, string senha)
    {
        var html = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#e85d24;padding:20px;text-align:center'>
                <h1 style='color:white;margin:0'>🍳 MerendaChef</h1>
                <p style='color:white;margin:5px 0'>Concurso Culinário FAETEC 2026</p>
            </div>
            <div style='padding:30px;background:#fff'>
                <h2>Olá, {nome}!</h2>
                <p>Seu cadastro foi realizado com sucesso.</p>
                <p>Sua senha temporária é:</p>
                <div style='background:#f5f5f5;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:3px;border-radius:8px'>
                    {senha}
                </div>
                <p style='margin-top:20px'>Acesse o sistema e troque sua senha no primeiro login.</p>
                <a href='http://10.200.15.32:3000/login' 
                   style='display:inline-block;background:#e85d24;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:10px'>
                    Acessar MerendaChef
                </a>
            </div>
            <div style='padding:15px;background:#f5f5f5;text-align:center;font-size:12px;color:#666'>
                FAETEC — Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro
            </div>
        </div>";

        await EnviarAsync(destinatario, "MerendaChef — Sua senha temporária", html);
    }

    public async Task EnviarConvocacaoSegundaFaseAsync(string destinatario, string nome, string nomeReceita, DateTime data, string local)
    {
        var html = $@"
        <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#e85d24;padding:20px;text-align:center'>
                <h1 style='color:white;margin:0'>🍳 MerendaChef</h1>
                <p style='color:white;margin:5px 0'>Concurso Culinário FAETEC 2026</p>
            </div>
            <div style='padding:30px;background:#fff'>
                <h2>🏆 Parabéns, {nome}!</h2>
                <p>Sua receita <strong>{nomeReceita}</strong> foi selecionada entre as 12 melhores do concurso!</p>
                <p>Você está convocado para a <strong>etapa presencial</strong>:</p>
                <div style='background:#fff8f0;border:2px solid #e85d24;padding:20px;border-radius:8px;margin:20px 0'>
                    <p style='margin:5px 0'><strong>📅 Data:</strong> {data:dd/MM/yyyy 'às' HH:mm}</p>
                    <p style='margin:5px 0'><strong>📍 Local:</strong> {local}</p>
                </div>
                <p style='color:#e85d24;font-weight:bold'>⚠️ Compareça com documento de identidade e com antecedência.</p>
                <a href='http://10.200.15.32:3000/minha-inscricao'
                   style='display:inline-block;background:#e85d24;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:10px'>
                    Ver minha inscrição
                </a>
            </div>
            <div style='padding:15px;background:#f5f5f5;text-align:center;font-size:12px;color:#666'>
                FAETEC — Fundação de Apoio à Escola Técnica do Estado do Rio de Janeiro
            </div>
        </div>";

        await EnviarAsync(destinatario, "🏆 MerendaChef — Você foi convocado para a 2ª Fase!", html);
    }
}
