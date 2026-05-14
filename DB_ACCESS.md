# Guia de Acesso ao Banco de Dados (PostgreSQL + Prisma)

Este guia explica como acessar e gerenciar o banco de dados do projeto SKLA.

## 🗄️ Informações de Conexão

O banco de dados roda em um container Docker chamado `db` utilizando PostgreSQL 15.

| Parâmetro | Valor Padrão (Local) |
| :--- | :--- |
| **Host** | `localhost` (ou `db` dentro da rede Docker) |
| **Porta** | `5432` |
| **Usuário** | `postgres` |
| **Senha** | `postgres` |
| **Banco** | `scheduling_db` |

---

## 🛠️ Métodos de Acesso

### 1. Prisma Studio (Recomendado - Interface Visual)
O Prisma Studio é a maneira mais fácil de visualizar e editar dados sem digitar comandos SQL.

1.  Certifique-se de que os containers estão rodando:
    ```bash
    docker compose up -d
    ```
2.  Inicie o Studio através do container do backend:
    ```bash
    docker compose exec backend npx prisma studio -p 5555 --browser none
    ```
3.  Acesse no seu navegador: `http://localhost:5555`

### 2. Linha de Comando (psql)
Se precisar rodar comandos SQL diretamente:

```bash
docker compose exec db psql -U postgres -d scheduling_db
```
*Comandos úteis no psql:*
- `\dt` : Lista todas as tabelas.
- `SELECT * FROM "User";` : Lista todos os usuários.
- `\q` : Sair do terminal.

### 3. Ferramentas Externas (DBeaver, TablePlus, pgAdmin)
Você pode conectar qualquer ferramenta de banco de dados usando a URL:
`postgresql://postgres:postgres@localhost:5432/scheduling_db`

---

## 🔄 Comandos Prisma Úteis

Caso você altere o arquivo `backend/prisma/schema.prisma`, use estes comandos para sincronizar:

### Gerar tipos do cliente (após mudar o schema)
```bash
docker compose exec backend npx prisma generate
```

### Criar uma migração (aplicar mudanças no banco)
```bash
docker compose exec backend npx prisma migrate dev --name nome_da_mudanca
```

### Resetar o banco de dados (CUIDADO: apaga todos os dados)
```bash
docker compose exec backend npx prisma migrate reset
```

---

## 🔒 Segurança
As credenciais estão definidas no arquivo `.env` na raiz do projeto. **Nunca suba senhas reais para o repositório Git.**
