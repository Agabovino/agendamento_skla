# Projeto Escala - Sistema de Agendamento

Este documento fornece as diretrizes fundamentais, arquitetura e convenções para o projeto **Escala**, um sistema de agendamento de alta fidelidade para a Produtora Skla.

## 🎯 Objetivo
Prover uma interface de agendamento "pixel-perfect" que permite aos usuários reservar horários de 1 hora para gravações e consultorias, com integração ao Google Calendar.

## 🏗️ Arquitetura
O projeto é composto por um monorepo dividido em:
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4.
- **Backend**: Node.js + Prisma ORM + PostgreSQL.
- **Infraestrutura**: Docker Compose + Cloudflare Tunnel para exposição segura.

## 🎨 Brand Identity (Identidade Visual)
As referências visuais em `frontend/ref_1.html` e `frontend/ref_2.html` são a **verdade absoluta** para o layout.

### Cores (Tailwind v4 Variables)
- **Primary**: `#532CB7` (`--color-primary`) - Usada para ações e destaques.
- **Secondary**: `#FEC200` (`--color-secondary`) - Destaque visual e botões de sucesso.
- **Brand Black**: `#000000` (`--color-brand-black`) - Bordas, sombras e texto principal.
- **Surface**: `#F9F9F9` - Cor de fundo principal.

### Tipografia e Estilo
- **Fonte**: `orig_ca_negroni_light` (deve ser usada em todos os títulos, botões e campos).
- **Estética**: Bordas sólidas de `2px`, sombras "hard shadow" (`4px 4px 0px 0px #000000`) e arredondamento de bordas `xl`.

## ⚙️ Regras de Negócio (Business Rules)
1. **Duração**: Blocos fixos de 1 hora.
2. **Buffer**: Intervalo obrigatório de 30 minutos entre agendamentos de usuários diferentes.
3. **Regra de Contiguidade**: Usuários podem selecionar múltiplos blocos seguidos. O sistema deve ignorar o buffer de 30 minutos *entre* esses blocos, mantendo-o apenas antes do primeiro e depois do último bloco da sequência.
4. **Timezone**: Fuso horário padrão de Brasília.

## 🛠️ Workflow de Desenvolvimento
- **Build**: Utilize `docker compose up --build` para garantir que as variáveis do Tailwind v4 e os tipos TypeScript sejam processados corretamente.
- **Service Names**: 
  - O frontend deve ser nomeado como `app` no Docker Compose para compatibilidade com o túnel.
  - O banco de dados deve ser referenciado como `db`.
- **Git**: Commits devem seguir o padrão Conventional Commits. O branch principal é `master`.

## 🚀 Comandos Úteis
```bash
# Iniciar ambiente completo
docker compose up -d

# Visualizar logs do túnel para debug de 502/Gateway
docker compose logs tunnel -f

# Sincronizar Prisma (Backend)
docker compose exec backend npx prisma generate
```

---
*Este arquivo é a base de conhecimento para o Gemini CLI e desenvolvedores do time.*
