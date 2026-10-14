import express, { type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import CryptoJS from 'crypto-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// SQLite local: DATABASE_URL="file:/caminho/absoluto/agendamento.db" (caminho relativo = pasta do backend)
const dbPath = path.resolve(__dirname, '..', (process.env.DATABASE_URL || 'file:./agendamento.db').replace(/^file:/, ''));
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const encrypt = (text: string) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
const decrypt = (ciphertext: string) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// --- HELPER: Refresh Google Token ---
const CALENDAR_UNAVAILABLE_MSG = 'A agenda está temporariamente indisponível para novos agendamentos. Por favor, tente novamente mais tarde ou entre em contato conosco.';

// O Google responde invalid_grant quando o refresh token foi revogado ou expirou:
// a única saída é a pessoa reconectar a conta no painel /admin/setup.
const isInvalidGrant = (e: any) =>
  e?.response?.data?.error === 'invalid_grant' || String(e?.message || '').includes('invalid_grant');

// Marca a conta como desconectada para o painel mostrar "Reconectar"
async function markDisconnected(user: any) {
  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (!current?.refreshToken) return; // já marcada
  console.error(`Google token inválido para ${user.email} — conta marcada como desconectada.`);
  await prisma.user.update({ where: { id: user.id }, data: { accessToken: null, refreshToken: null, tokenExpiry: null } });
  await prisma.systemSettings.updateMany({
    data: user.isAdmin ? { isCalendarConnected: false } : { isEmployeeConnected: false }
  });
  await sendDisconnectAlert(user);
}

// --- ALERTA POR E-MAIL (Resend) ---
// RESEND_API_KEY: chave de envio | ALERT_EMAIL_TO: destinatários separados por vírgula
// ALERT_EMAIL_FROM: remetente (sem domínio verificado no Resend, só funciona onboarding@resend.dev → e-mail dono da conta)
async function sendDisconnectAlert(user: any) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.ALERT_EMAIL_TO || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!apiKey || to.length === 0) return;

  const setupUrl = new URL('/admin/setup', process.env.GOOGLE_REDIRECT_URI || 'https://agendamento.skla.video').toString();
  const which = user.isAdmin ? 'agenda principal' : 'agenda do funcionário';
  const impact = user.isAdmin
    ? 'Enquanto ela não for reconectada, os clientes <b>não conseguem fazer novos agendamentos</b>.'
    : 'Os agendamentos continuam funcionando, mas <b>não estão sendo copiados</b> para a agenda do funcionário.';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM || 'Agendamento SKLA <onboarding@resend.dev>',
        to,
        subject: `⚠️ Reconecte a ${which} (${user.email}) — Agendamento SKLA`,
        html: `
          <p>O Google encerrou o acesso do sistema de agendamento à <b>${which}</b> (<b>${user.email}</b>).</p>
          <p>${impact}</p>
          <p><b>Como resolver:</b></p>
          <ol>
            <li>Acesse <a href="${setupUrl}">${setupUrl}</a> e entre com a senha do painel.</li>
            <li>Clique em <b>Reconectar</b> no cartão da ${which}.</li>
            <li>Entre com a conta <b>${user.email}</b>. Se aparecer "O Google não verificou este app", clique em <b>Avançado → Acessar Agendamento Skla</b>.</li>
          </ol>`
      })
    });
    if (!res.ok) console.error('Falha ao enviar alerta por e-mail:', res.status, await res.text());
    else console.log(`Alerta de desconexão enviado para ${to.join(', ')}`);
  } catch (e) {
    console.error('Falha ao enviar alerta por e-mail:', e);
  }
}

// Verificação periódica: detecta conta desconectada mesmo sem ninguém usar o site
const HEALTH_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    const users = await prisma.user.findMany({ where: { OR: [{ isAdmin: true }, { isEmployee: true }], refreshToken: { not: null } } });
    for (const u of users) await checkConnection(u);
  } catch (e) {
    console.error('Erro na verificação periódica das agendas:', e);
  }
}, HEALTH_CHECK_INTERVAL_MS).unref();

// Cliente OAuth próprio por usuário (o global é compartilhado e misturaria credenciais entre admin e funcionário)
async function getAuthenticatedClient(user: any, forceRefresh = false) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: user.accessToken ? decrypt(user.accessToken) : undefined,
    refresh_token: decrypt(user.refreshToken),
    expiry_date: user.tokenExpiry?.getTime()
  });

  // Verifica se expirou ou está perto (5 mins)
  if (forceRefresh || !user.tokenExpiry || user.tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000) {
    try {
      const { credentials } = await client.refreshAccessToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: credentials.access_token ? encrypt(credentials.access_token) : undefined,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
        }
      });
      client.setCredentials(credentials);
    } catch (e) {
      if (isInvalidGrant(e)) await markDisconnected(user);
      throw e;
    }
  }
  return client;
}

// Testa de verdade se o Google ainda aceita o token da conta
async function checkConnection(user: any) {
  if (!user) return null;
  if (!user.refreshToken) return { connected: false, email: user.email, needsReconnect: true };
  try {
    await getAuthenticatedClient(user, true);
    return { connected: true, email: user.email, needsReconnect: false };
  } catch (e) {
    // Erro que não é invalid_grant (ex.: rede instável): não assume desconexão
    if (!isInvalidGrant(e)) return { connected: true, email: user.email, needsReconnect: false, checkFailed: true };
    return { connected: false, email: user.email, needsReconnect: true };
  }
}

// --- ADMIN AUTH ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Senha incorreta' });
});

app.get('/api/admin/status', async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ connected: false });

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ connected: false });
  }

  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  const employee = await prisma.user.findFirst({ where: { isEmployee: true } });
  const [adminStatus, employeeStatus] = await Promise.all([checkConnection(admin), checkConnection(employee)]);

  res.json({
    admin: adminStatus,
    employee: employeeStatus,
    // Suporte legado (frontend pode estar usando isso para o estado inicial)
    connected: !!adminStatus?.connected,
    email: admin?.email
  });
});
// --- GOOGLE OAUTH FLOW (STILL USED BY ADMIN) ---
app.get('/api/auth/google', (req, res) => {
  const { role } = req.query; // 'admin' or 'employee'
  const state = JSON.stringify({ role: role || 'admin' });
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.events'],
    state: Buffer.from(state).toString('base64')
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const role = decodedState.role;

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const updateData: any = {
      accessToken: encrypt(tokens.access_token!),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      tokenExpiry: new Date(tokens.expiry_date!),
    };

    if (role === 'admin') {
      updateData.isAdmin = true;
      updateData.isEmployee = false;
    } else if (role === 'employee') {
      updateData.isEmployee = true;
      updateData.isAdmin = false;
    }

    const user = await prisma.user.upsert({
      where: { googleId: userInfo.id! },
      update: updateData,
      create: {
        googleId: userInfo.id!,
        email: userInfo.email!,
        name: userInfo.name,
        accessToken: encrypt(tokens.access_token!),
        refreshToken: encrypt(tokens.refresh_token!),
        tokenExpiry: new Date(tokens.expiry_date!),
        isAdmin: role === 'admin',
        isEmployee: role === 'employee'
      }
    });

    // Se for admin, garante que apenas ele seja o admin principal
    if (role === 'admin') {
      await prisma.user.updateMany({
        where: { id: { not: user.id }, isAdmin: true },
        data: { isAdmin: false }
      });
      await prisma.systemSettings.updateMany({
        data: { isCalendarConnected: true }
      });
    } else if (role === 'employee') {
      await prisma.user.updateMany({
        where: { id: { not: user.id }, isEmployee: true },
        data: { isEmployee: false }
      });
      await prisma.systemSettings.updateMany({
        data: { isEmployeeConnected: true }
      });

      // Sync retroativo: copiar todos os agendamentos futuros para o Calendar do funcionário
      try {
        const futureAppointments = await prisma.appointment.findMany({
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' }
        });

        if (futureAppointments.length > 0) {
          const empAuth = await getAuthenticatedClient(user);
          const empCalendar = google.calendar({ version: 'v3', auth: empAuth });

          for (const appt of futureAppointments) {
            try {
              await empCalendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                  summary: `${appt.service || 'Agendamento'} - ${appt.clientName}`,
                  description: `Serviço: ${appt.service}\nLocal: ${appt.location}\nCliente: ${appt.clientEmail}\n(Cópia Funcionário - Sync Retroativo)`,
                  start: { dateTime: appt.startTime.toISOString() },
                  end: { dateTime: appt.endTime.toISOString() },
                  attendees: [{ email: appt.clientEmail }],
                },
                sendUpdates: 'none',
              });
            } catch (syncErr) {
              console.error(`Error syncing appointment ${appt.id} to employee calendar:`, syncErr);
            }
          }
          console.log(`Retroactive sync: ${futureAppointments.length} appointments synced to employee calendar.`);
        }
      } catch (syncError) {
        console.error('Error during retroactive sync to employee calendar:', syncError);
      }
    }

    res.redirect('/admin/setup?success=true');
  } catch (e) {
    console.error('Auth error:', e);
    res.redirect('/admin/setup?error=auth_failed');
  }
});

// --- SYSTEM SETTINGS ---
app.get('/api/admin/settings', async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    jwt.verify(token, JWT_SECRET);
    const settings = await prisma.systemSettings.findFirst() || await prisma.systemSettings.create({ data: { id: 1 } });
    res.json(settings);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    jwt.verify(token, JWT_SECRET);
    const { blockEveningSlots, eveningStartCustom, eveningEndCustom } = req.body;
    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { 
        blockEveningSlots, 
        eveningStartCustom: eveningStartCustom || undefined, 
        eveningEndCustom: eveningEndCustom || undefined 
      },
      create: { 
        id: 1, 
        blockEveningSlots: blockEveningSlots || false,
        eveningStartCustom: eveningStartCustom || "17:30",
        eveningEndCustom: eveningEndCustom || "22:00"
      }
    });
    res.json(settings);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- PUBLIC APPOINTMENTS ---
app.get('/api/availability', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  const employee = await prisma.user.findFirst({ where: { isEmployee: true } });
  
  if (!admin) return res.status(503).json({ error: 'System not configured' });
  if (!admin.refreshToken) return res.status(503).json({ error: CALENDAR_UNAVAILABLE_MSG, code: 'calendar_disconnected' });

  try {
    const settings = await prisma.systemSettings.findFirst();
    
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    const busySlots: any[] = [];

    // Fetch from Admin
    const adminAuth = await getAuthenticatedClient(admin);
    const adminCalendar = google.calendar({ version: 'v3', auth: adminAuth });
    const adminResponse = await adminCalendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      fields: 'items(start,end,summary),updated', 
    });
    
    if (adminResponse.data.items) {
      busySlots.push(...adminResponse.data.items.map(event => ({
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        title: event.summary
      })));
    }

    res.json({ 
      busy: busySlots, 
      settings: { 
        blockEveningSlots: settings?.blockEveningSlots || false,
        eveningStartCustom: settings?.eveningStartCustom || "17:30",
        eveningEndCustom: settings?.eveningEndCustom || "22:00"
      } 
    });
  } catch (e) {
    console.error('Error fetching calendars:', e);
    if (isInvalidGrant(e)) {
      await markDisconnected(admin);
      return res.status(503).json({ error: CALENDAR_UNAVAILABLE_MSG, code: 'calendar_disconnected' });
    }
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { clientEmail, clientName, startTime, endTime, location, service } = req.body;
  const start = new Date(startTime);
  const end = new Date(endTime);

  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  const employee = await prisma.user.findFirst({ where: { isEmployee: true } });
  
  if (!admin) return res.status(503).json({ error: 'System not configured' });
  if (!admin.refreshToken) return res.status(503).json({ error: CALENDAR_UNAVAILABLE_MSG, code: 'calendar_disconnected' });

  try {
    // 1. Inserir no Google Calendar do Admin (antes do banco: se o Google falhar, nada fica salvo pela metade)
    const auth = await getAuthenticatedClient(admin);
    const calendar = google.calendar({ version: 'v3', auth });

    const eventBody = {
      summary: `${service || 'Agendamento'} - ${clientName}`,
      description: `Serviço: ${service}\nLocal: ${location}\nCliente: ${clientEmail}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [{ email: clientEmail }],
    };

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
      sendUpdates: 'all',
    });

    // 2. Salvar no banco local
    const appointment = await prisma.appointment.create({
      data: {
        hostId: admin.id,
        clientEmail,
        clientName,
        location,
        service,
        startTime: start,
        endTime: end
      }
    });

    // 3. Inserir no Google Calendar do Funcionário
    if (employee && employee.refreshToken) {
      try {
        const empAuth = await getAuthenticatedClient(employee);
        const empCalendar = google.calendar({ version: 'v3', auth: empAuth });
        await empCalendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            ...eventBody,
            description: `${eventBody.description}\n(Cópia Funcionário)`
          },
          sendUpdates: 'none',
        });
      } catch (empErr) {
        console.error('Error adding event to employee calendar:', empErr);
        if (isInvalidGrant(empErr)) await markDisconnected(employee);
      }
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    if (isInvalidGrant(error)) {
      await markDisconnected(admin);
      return res.status(503).json({ error: CALENDAR_UNAVAILABLE_MSG, code: 'calendar_disconnected' });
    }
    res.status(500).json({ error: 'Não foi possível concluir o agendamento. Tente novamente em instantes.' });
  }
});

app.get('*splat', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
