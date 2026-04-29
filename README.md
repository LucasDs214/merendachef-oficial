# 🍳 MerendaChef — Plataforma de Concurso Culinário FAETEC

Sistema completo para gerenciar o concurso culinário da rede FAETEC, com módulo de inscrição para candidatos e painel administrativo completo.

---

## 🏗️ Arquitetura

```
merendachef/
├── backend/                  # ASP.NET Core 8 (C#)
│   ├── Controllers/
│   │   ├── AuthController.cs       # Login, registro, troca de senha
│   │   ├── InscricoesController.cs # Wizard de inscrição + ingredientes
│   │   └── AdminController.cs      # Gestão, notas, ranking
│   ├── Models/
│   │   └── Entities.cs             # Candidato, Inscricao, Ingrediente...
│   ├── Data/
│   │   └── AppDbContext.cs         # EF Core + Seed Anexo I
│   ├── Services/
│   │   └── EmailService.cs         # Mock (prod: MailKit SMTP)
│   └── Program.cs                  # DI, JWT, CORS, Migrations
│
├── frontend/                 # React 18 + TypeScript + Tailwind
│   └── src/
│       ├── App.tsx                 # Roteamento + todas as páginas
│       ├── components/
│       │   ├── wizard/
│       │   │   └── InscricaoWizard.tsx  # Wizard 5 passos mobile-first
│       │   └── admin/
│       │       └── AdminPanel.tsx       # Painel completo + modal
│       ├── hooks/useAuth.ts        # Zustand auth store
│       ├── utils/api.ts            # Axios client + endpoints
│       └── types/index.ts          # TypeScript interfaces
│
├── infra/
│   └── init.sql                    # PostgreSQL init
└── docker-compose.yml              # 3 containers orquestrados
```

---

## 🚀 Como Rodar

### Pré-requisitos
- Docker Desktop 24+
- Docker Compose v2

### Subir tudo com um comando
```bash
cd merendachef
docker-compose up --build
```

| Serviço    | URL                           |
|------------|-------------------------------|
| Frontend   | http://localhost:3000         |
| Backend API| http://localhost:8080         |
| Swagger    | http://localhost:8080/swagger |
| PostgreSQL | localhost:5432                |

### Desenvolvimento local (sem Docker)
```bash
# Backend
cd backend
dotnet ef database update
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```

---

## 👤 Credenciais Padrão

| Tipo  | Usuário                    | Senha        |
|-------|----------------------------|--------------|
| Admin | admin@faetec.rj.gov.br     | Admin@2025!  |

> ⚠️ Altere as credenciais antes de ir para produção!

---

## 📋 Fluxo do Sistema

### Candidato
1. **Registro** → CPF + e-mail → senha temporária enviada por e-mail
2. **Primeiro acesso** → troca obrigatória de senha
3. **Wizard de Inscrição** (5 passos):
   - Passo 1: Unidade FAETEC, nome do diretor, matrícula, cargo
   - Passo 2: Upload comprovante de vínculo (PDF/imagem)
   - Passo 3: Nome da receita + descrição + foto opcional
   - Passo 4: Seleção de ingredientes do Anexo I (Pregão)
   - Passo 5: Aceite LGPD + autorização de uso de imagem
4. **Unicidade**: sistema bloqueia 2ª inscrição pelo mesmo CPF

### Administrador
1. **Visualização** de fichas técnicas (Anexo II)
2. **Habilitação técnica**: Habilitada ✅ ou Eliminada ❌ (com motivo)
3. **Pontuação** (0–50 por critério):
   - Viabilidade de Preparo
   - Criatividade
   - Cultura Regional
   - Alimentos In Natura
4. **Ranking automático** com desempate:
   1º In Natura → 2º Viabilidade → 3º Criatividade → 4º Regional

---

## 🔐 Segurança
- Senhas hasheadas com **BCrypt** (cost factor 10)
- Autenticação via **JWT** (HS256, expiração 8h)
- Validação de **CPF** (algoritmo oficial)
- Upload restrito a `.pdf`, `.jpg`, `.jpeg`, `.png`
- Sanitização de arquivos por MIME type + extensão
- **LGPD**: termo explícito na inscrição

---

## 🌱 Ingredientes (Seed Automático)

O sistema já popula automaticamente o banco com os ingredientes do Anexo I agrupados por categoria:
- Grãos e Cereais (8 itens)
- Proteínas Animais (7 itens)
- Hortaliças — In Natura (19 itens)
- Frutas — In Natura (8 itens)
- Laticínios e Derivados (5 itens)
- Temperos e Condimentos (12 itens)
- Leguminosas (4 itens)

---

## ⚙️ Variáveis de Ambiente

```env
DB_PASSWORD=MerendaChef@2025!
JWT_SECRET=MerendaChefSuperSecretKey2025!XYZ
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=seu_usuario_mailtrap
SMTP_PASS=sua_senha_mailtrap
```

Para ativar e-mail real, edite `backend/Services/EmailService.cs` e descomente o bloco MailKit.

---

## 📧 Serviço de E-mail (Mock)

Em desenvolvimento, o e-mail é **logado no console** do container backend:
```
docker-compose logs backend | grep "MOCK EMAIL"
```

---

## 🗃️ Migrations EF Core

```bash
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

O `Program.cs` aplica as migrations automaticamente ao subir via Docker.
