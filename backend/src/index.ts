import express, { type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import CryptoJS from 'crypto-js';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';

// Auxiliares de Criptografia
const encrypt = (text: string) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
const decrypt = (ciphertext: string) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// --- AUTH ROUTES ---

app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Força a entrega do refresh_token
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Authorization code missing');

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email || !userInfo.id) {
      return res.status(500).send('Failed to get user info from Google');
    }

    // Upsert User com tokens criptografados
    const user = await prisma.user.upsert({
      where: { googleId: userInfo.id },
      update: {
        email: userInfo.email,
        name: userInfo.name,
        accessToken: tokens.access_token ? encrypt(tokens.access_token) : undefined,
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token!) : undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      create: {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        accessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    // Criar JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set HttpOnly Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    // Redirecionar para o frontend
    res.redirect(process.env.FRONTEND_URL || '/');
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ user: null });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });
    res.json({ user });
  } catch (e) {
    res.status(401).json({ user: null });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// --- RESTO DA LÓGICA (APPOINTMENTS) ---

const BUFFER_MINUTES = 30;

async function isSlotAvailable(hostId: number, clientEmail: string, start: Date, end: Date) {
  const overlaps = await prisma.appointment.findFirst({
    where: {
      hostId,
      OR: [{ startTime: { lt: end }, endTime: { gt: start } }]
    }
  });
  if (overlaps) return false;

  const preceding = await prisma.appointment.findFirst({
    where: { hostId, endTime: { lte: start } },
    orderBy: { endTime: 'desc' }
  });

  if (preceding) {
    const gap = (start.getTime() - preceding.endTime.getTime()) / (1000 * 60);
    if (preceding.clientEmail !== clientEmail && gap < BUFFER_MINUTES) return false;
  }

  const succeeding = await prisma.appointment.findFirst({
    where: { hostId, startTime: { gte: end } },
    orderBy: { startTime: 'asc' }
  });

  if (succeeding) {
    const gap = (succeeding.startTime.getTime() - end.getTime()) / (1000 * 60);
    if (succeeding.clientEmail !== clientEmail && gap < BUFFER_MINUTES) return false;
  }

  return true;
}

app.post('/api/appointments', async (req: Request, res: Response) => {
  const { hostId, clientEmail, startTime } = req.body;
  const start = new Date(startTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const available = await isSlotAvailable(hostId, clientEmail, start, end);
  if (!available) return res.status(400).json({ error: 'Slot not available' });

  try {
    const appointment = await prisma.appointment.create({
      data: { hostId, clientEmail, startTime: start, endTime: end },
    });

    const host = await prisma.user.findUnique({ where: { id: hostId } });
    if (host && host.refreshToken) {
      const decryptedRefresh = decrypt(host.refreshToken);
      oauth2Client.setCredentials({ refresh_token: decryptedRefresh });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Agendamento: ${clientEmail}`,
          description: 'Gerado automaticamente pelo sistema Skla',
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: [{ email: clientEmail }],
        },
        sendUpdates: 'all',
      });
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error creating appointment' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
