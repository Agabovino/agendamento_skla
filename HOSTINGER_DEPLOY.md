# 🚀 Guia de Deploy — Hostinger hPanel (Node.js Selector)

## Visão Geral do Fluxo
```
Supabase (PostgreSQL - IPv4 Pooler) ← Backend (Node.js/Express) → Frontend (React, servido como estático)
                                            ↑
                                 Hostinger Node.js Web App
```

---

## ⚠️ Dificuldades Críticas da Hostinger e Como Contornamos

### 1. Incompatibilidade de IPv6 (Supabase Direct)
*   **Problema:** Projetos recentes do Supabase usam conexões diretas `db.[id].supabase.co` exclusivas em **IPv6**. A Hostinger Compartilhada/Cloud suporta apenas conexões de saída em **IPv4**.
*   **Solução:** Devemos usar o **Connection Pooler** do Supabase (`aws-1-[regiao].pooler.supabase.com:6543` com a opção `?pgbouncer=true`), que possui endereços IPv4 válidos.

### 2. Barra Invertida na Senha (`\%3F` em vez de `%3F`)
*   **Problema:** Se a senha do banco começar com um caractere especial como `?` (interrogação), ela precisa ser URL-encoded para `%3F`. Porém, a Hostinger escapa caracteres `%` no hPanel, enviando `\%3F` para o Node.js, corrompendo a senha.
*   **Solução:** Criar um arquivo `.env` na pasta de execução do servidor contendo as credenciais exatas. Nosso código está configurado com `dotenv.config({ override: true })` para forçar o uso deste arquivo.

### 3. Versão do Node.js (Exigência do Prisma 7)
*   **Problema:** O Prisma 7 exige pacotes que requerem **Node.js >= 22.0.0**.
*   **Solução:** O aplicativo no painel Node.js da Hostinger deve estar configurado na **versão 22** (ou superior).

---

## ETAPA 1 — Configurar o Banco de Dados no Supabase

1. Acesse seu painel no [Supabase](https://supabase.com).
2. Clique no botão **Connect** (no topo superior direito).
3. Selecione a aba **URI** e escolha a opção **Transaction Pooler** (modo transação, porta `6543`).
4. Copie a URL gerada no formato:
   ```
   postgresql://postgres.[ID-PROJETO]:[SENHA]@aws-1-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. **URL-encode da senha:** Se a sua senha começar com `?`, mude esse caractere para `%3F` (ex: `?senha123` vira `%3Fsenha123`).

---

## ETAPA 2 — Configurar o Google Cloud Console

1. Acesse [https://console.cloud.google.com](https://console.cloud.google.com).
2. Vá em **APIs & Services → Credentials → OAuth 2.0 Client IDs**.
3. Adicione o seguinte URI em **Authorized redirect URIs**:
   ```
   https://SEU_DOMINIO.hostingersite.com/api/auth/google/callback
   ```
   *(Substitua pelo seu domínio temporário ou final da Hostinger)*

---

## ETAPA 3 — Buildar o Projeto Localmente

Abra o terminal na pasta do projeto e execute:

```bash
cd backend
npm install
npm run hostinger:build
```
Isso fará:
1. Compilação do TypeScript backend para a pasta `dist/`.
2. Instalação e build do React frontend.
3. Cópia dos arquivos do frontend para `backend/dist/public/`.

---

## ETAPA 4 — Criar e Enviar o ZIP do Aplicativo

1. Acesse a pasta `backend/` localmente.
2. Selecione e compacte em um arquivo `.zip` apenas os seguintes itens:
   * 📁 `dist/`
   * 📁 `prisma/`
   * 📄 `loader.cjs`
   * 📄 `package.json`
   * 📄 `package-lock.json`
3. Envie o ZIP pelo painel da Hostinger (hPanel Node.js Selector).

---

## ETAPA 5 — Configurar as Variáveis no Servidor (`.env`)

Para contornar o problema de escape de caracteres da Hostinger, conecte-se ao servidor via **SSH** e crie o arquivo `.env` diretamente na pasta do aplicativo:

```bash
# Entre na pasta do aplicativo
cd domains/SEU_DOMINIO/public_html   # Ou cd domains/SEU_DOMINIO/nodejs

# Crie o arquivo .env
cat << 'EOF' > .env
DATABASE_URL="postgresql://postgres.[ID-PROJETO]:[SENHA-URL-ENCODED]@aws-1-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true"
GOOGLE_CLIENT_ID="seu_client_id"
GOOGLE_CLIENT_SECRET="seu_client_secret"
GOOGLE_REDIRECT_URI="https://SEU_DOMINIO/api/auth/google/callback"
ADMIN_PASSWORD="sua_senha_painel_admin"
ENCRYPTION_KEY="sua_chave_criptografia_32_chars"
JWT_SECRET="seu_jwt_secret"
NODE_ENV="production"
EOF
```

---

## ETAPA 6 — Ajustes no hPanel da Hostinger

1. Vá em **Sites → [Seu Site] → Node.js**.
2. Altere os campos para:
   * **Node.js version:** `22` (ou superior)
   * **Application root:** Pasta onde estão extraídos os arquivos (geralmente `/` ou `/nodejs`).
   * **Application startup file:** `loader.cjs`
3. Clique em **Salvar** e depois em **Restart**.

---

## ETAPA 7 — Rodar as Tabelas no Banco de Dados

Caso ainda precise atualizar a estrutura de tabelas do banco no Supabase, você pode rodar localmente do seu próprio computador:

```bash
DATABASE_URL="sua_url_do_pooler_com_senha_url_encoded" npx prisma db push
```

---

## 🐛 Troubleshooting

* **Erro 503 com JSON `{"error":"System not configured"}`**: 
  Conexão com o banco efetuada com sucesso! Acesse `/admin/setup` e configure a conta do Google para carregar as configurações iniciais.
* **Erro: `Can't reach database server at 2600:...`**:
  O Node.js ainda está tentando conectar via IPv6. Certifique-se de que o host da `DATABASE_URL` no `.env` foi alterado para o Pooler (`pooler.supabase.com`) e o `dotenv.config` está com `override: true`.
* **Erro: `DriverAdapterError: (ENOTFOUND) tenant/user ... not found`**:
  Isso ocorre se o projeto do Supabase estiver pausado (no plano gratuito do Supabase, projetos inativos por dias são pausados automaticamente) ou se a região da URL do pooler (`aws-1-[regiao].pooler.supabase.com`) estiver incorreta. Ative o projeto no painel do Supabase ("Resume Project") e verifique se a região na URL está correta (ex: `us-east-1` ou `sa-east-1`).
* **Erro: `Request had insufficient authentication scopes` (ao duplicar agendamento para funcionário)**:
  A conta do funcionário foi conectada no passado com permissões insuficientes. Acesse `/admin/setup`, desconecte a conta do funcionário e reconecte-a para forçar o consentimento dos novos escopos de escrita no Google Calendar.

