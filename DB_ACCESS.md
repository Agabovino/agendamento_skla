# Guia de Acesso ao Banco de Dados (SQLite + Prisma)

O banco é um arquivo **SQLite**, acessado pelo Prisma através do adapter `@prisma/adapter-better-sqlite3`.
O caminho vem da variável `DATABASE_URL` (formato `file:<caminho>`; caminhos relativos partem da pasta `backend/`).

| Ambiente | Arquivo |
|---|---|
| **Local** | `backend/agendamento.db` (`DATABASE_URL="file:./agendamento.db"`) |
| **Produção (Hostinger)** | `/home/u528425499/data/agendamento.db` |

## Criar / atualizar as tabelas
```bash
cd backend
npx prisma db push
```

## Visualizar os dados (Prisma Studio)
```bash
cd backend
npx prisma studio
```

## Ver os dados de produção
Baixe uma cópia e abra localmente (Prisma Studio, DB Browser for SQLite etc.):
```bash
scp -P 65002 u528425499@147.79.84.129:data/agendamento.db ./agendamento-prod.db
DATABASE_URL="file:./agendamento-prod.db" npx prisma studio
```

Veja a seção **Backup do Banco** em `HOSTINGER_DEPLOY.md`.
