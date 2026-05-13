import express, {} from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
app.use(express.json());
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
const BUFFER_MINUTES = 30;
// Availability logic
async function isSlotAvailable(hostId, clientEmail, start, end) {
    // 1. Check for direct overlaps
    const overlaps = await prisma.appointment.findFirst({
        where: {
            hostId,
            OR: [
                { startTime: { lt: end }, endTime: { gt: start } }
            ]
        }
    });
    if (overlaps)
        return false;
    // 2. Check preceding appointment for buffer
    const preceding = await prisma.appointment.findFirst({
        where: { hostId, endTime: { lte: start } },
        orderBy: { endTime: 'desc' }
    });
    if (preceding) {
        const gap = (start.getTime() - preceding.endTime.getTime()) / (1000 * 60);
        // Apply buffer only if it's a different client
        if (preceding.clientEmail !== clientEmail && gap < BUFFER_MINUTES) {
            return false;
        }
    }
    // 3. Check succeeding appointment for buffer
    const succeeding = await prisma.appointment.findFirst({
        where: { hostId, startTime: { gte: end } },
        orderBy: { startTime: 'asc' }
    });
    if (succeeding) {
        const gap = (succeeding.startTime.getTime() - end.getTime()) / (1000 * 60);
        // Apply buffer only if it's a different client
        if (succeeding.clientEmail !== clientEmail && gap < BUFFER_MINUTES) {
            return false;
        }
    }
    return true;
}
// Routes
app.post('/api/appointments', async (req, res) => {
    const { hostId, clientEmail, startTime } = req.body;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
    const available = await isSlotAvailable(hostId, clientEmail, start, end);
    if (!available) {
        return res.status(400).json({ error: 'Selected slot is not available due to overlap or buffer rules.' });
    }
    try {
        const appointment = await prisma.appointment.create({
            data: {
                hostId,
                clientEmail,
                startTime: start,
                endTime: end,
            },
        });
        // Google Calendar Sync Logic
        const host = await prisma.user.findUnique({ where: { id: hostId } });
        if (host && host.googleRefreshToken) {
            oauth2Client.setCredentials({ refresh_token: host.googleRefreshToken });
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
                sendUpdates: 'all', // Send email invitation to client
            });
        }
        res.status(201).json(appointment);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating appointment' });
    }
});
// Auth Routes
app.get('/api/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events', 'email'],
    });
    res.redirect(url);
});
app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    // Extract email and save refresh token to user
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    await prisma.user.upsert({
        where: { email: userInfo.data.email },
        update: { googleRefreshToken: tokens.refresh_token ?? null },
        create: {
            email: userInfo.data.email,
            googleRefreshToken: tokens.refresh_token ?? null,
        },
    });
    res.send('Authentication successful! You can close this tab.');
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
