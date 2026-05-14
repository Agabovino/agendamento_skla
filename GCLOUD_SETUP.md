# Guia de Configuração: Google Cloud & Agenda

Siga estes passos para configurar as credenciais do Google necessárias para o funcionamento do sistema de agendamento.

## 1. Criar Projeto no Google Cloud Console
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Clique em **Select a project** > **New Project**.
3. Dê um nome ao projeto (ex: `SKLA-Agendamento`) e clique em **Create**.

## 2. Ativar a Google Calendar API
1. No menu lateral, vá em **APIs & Services** > **Library**.
2. Procure por **Google Calendar API**.
3. Clique na API e depois em **Enable**.

## 3. Configurar a Tela de Consentimento OAuth
1. Vá em **APIs & Services** > **OAuth consent screen**.
2. Escolha **External** (ou Internal se estiver em uma organização Google Workspace).
3. Preencha os dados básicos:
   - App name: `SKLA Agendamento`
   - User support email: Seu e-mail.
   - Developer contact info: Seu e-mail.
4. Em **Scopes**, adicione: `.../auth/calendar.events` e `.../auth/calendar.readonly`.
5. Em **Test users**, adicione o seu e-mail (importante enquanto o app estiver em modo "Testing").

## 4. Criar Credenciais OAuth 2.0
1. Vá em **APIs & Services** > **Credentials**.
2. Clique em **+ Create Credentials** > **OAuth client ID**.
3. Em **Application type**, selecione **Web application**.
4. Configure as URLs:
   - **Authorized JavaScript origins**: `https://seu-dominio.com.br` (ou `http://localhost:5173` para teste).
   - **Authorized redirect URIs**: `https://seu-dominio.com.br/api/auth/google/callback`.
5. Clique em **Create**.
6. Você receberá um **Client ID** e um **Client Secret**.

## 5. Configurar o arquivo .env
Adicione as credenciais ao seu arquivo `.env` na raiz do projeto:

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://seu-dominio.com.br/api/auth/google/callback
```

## 6. Sincronização
Após configurar o `.env` e reiniciar o servidor, acesse a rota `/admin/setup` no sistema para realizar o login com o Google e autorizar o acesso à agenda.
