# 🚀 Guia de Deploy — Hostinger (Node.js + SQLite)

## Visão Geral do Fluxo
```
SQLite (arquivo local no servidor) ← Backend (Node.js/Express) → Frontend (React, servido como estático)
                                            ↑
                                 Hostinger Node.js Web App (Passenger)
```

* **Servidor:** `ssh -p 65002 u528425499@147.79.84.129`
* **App:** `~/domains/agendamento.skla.video/nodejs`
* **Banco:** `~/data/agendamento.db` — fica **fora** da pasta do app, para que um novo deploy nunca apague os dados.

> O banco antes ficava no Supabase (plano free), que pausava o projeto por inatividade e derrubava o sistema.
> Agora o banco é um arquivo SQLite no próprio servidor: sem custo, sem limite de uso e sem dependência externa.

---

## ⚠️ Pontos de Atenção da Hostinger

### 1. Versão do Node.js (Exigência do Prisma 7)
O app deve rodar em **Node.js 22** (ou superior). No SSH, use:
```bash
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
```

### 2. Variáveis de ambiente via `.env`
O hPanel escapa caracteres especiais. Por isso as variáveis ficam num arquivo `.env` na pasta do app, e o código usa `dotenv.config({ override: true })`.

---

## ETAPA 1 — Configurar o Google Cloud Console

Projeto: `skla-agendamento`. Em **APIs & Services → Credentials → OAuth 2.0 Client IDs**, o redirect URI deve ser:
```
https://agendamento.skla.video/api/auth/google/callback
```

---

## ETAPA 2 — Buildar o Projeto Localmente

```bash
cd backend
npm install
npm run hostinger:build
```
Isso compila o backend para `dist/`, builda o frontend e copia para `backend/dist/public/`.

---

## ETAPA 3 — Enviar os Arquivos ao Servidor

Na pasta `backend/`:
```bash
R=u528425499@147.79.84.129:domains/agendamento.skla.video/nodejs
SSH="ssh -p 65002"
rsync -az -e "$SSH" package.json package-lock.json prisma.config.js loader.cjs $R/
rsync -az -e "$SSH" prisma/schema.prisma $R/prisma/
rsync -az -e "$SSH" dist/index.js $R/dist/
rsync -az --delete -e "$SSH" dist/public/ $R/dist/public/
```

---

## ETAPA 4 — Configurar o `.env` no Servidor (apenas na primeira vez)

```bash
cd ~/domains/agendamento.skla.video/nodejs
cat << 'EOF' > .env
DATABASE_URL="file:/home/u528425499/data/agendamento.db"
GOOGLE_CLIENT_ID="seu_client_id"
GOOGLE_CLIENT_SECRET="seu_client_secret"
GOOGLE_REDIRECT_URI="https://agendamento.skla.video/api/auth/google/callback"
ADMIN_PASSWORD="sua_senha_painel_admin"
ENCRYPTION_KEY="sua_chave_criptografia_32_chars"
JWT_SECRET="seu_jwt_secret"
NODE_ENV="production"
EOF
```

---

## ETAPA 5 — Instalar, Atualizar Tabelas e Reiniciar

```bash
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
cd ~/domains/agendamento.skla.video/nodejs
npm ci --omit=dev        # instala dependências (inclui o driver nativo do SQLite)
npx prisma db push       # cria/atualiza as tabelas no arquivo SQLite
touch tmp/restart.txt    # reinicia o app (Passenger)
```

---

## 💾 Backup do Banco

O banco inteiro é um único arquivo. Para fazer uma cópia consistente (mesmo com o app rodando):
```bash
mkdir -p ~/backups
/opt/alt/alt-nodejs22/root/usr/bin/node -e "require('/home/u528425499/domains/agendamento.skla.video/nodejs/node_modules/better-sqlite3')('/home/u528425499/data/agendamento.db').backup('/home/u528425499/backups/agendamento-'+new Date().toISOString().slice(0,10)+'.db')"
```
Para automatizar, cadastre esse comando em **hPanel → Avançado → Cron Jobs** (ex.: diariamente).

Para baixar uma cópia para o seu computador:
```bash
scp -P 65002 u528425499@147.79.84.129:data/agendamento.db ./agendamento-backup.db
```

---

## 🐛 Troubleshooting

* **Erro 503 com JSON `{"error":"System not configured"}`**:
  O banco está funcionando, mas ainda não há conta configurada. Acesse `/admin/setup` e conecte a conta do Google.
* **`Cannot open database because the directory does not exist`**:
  Confira o caminho em `DATABASE_URL` no `.env` (deve começar com `file:`).
* **Logs do app:** `~/domains/agendamento.skla.video/nodejs/console.log` e `stderr.log`.
