/**
 * Google Calendar integration
 * - Cria eventos ao confirmar agendamento
 * - Remove eventos ao cancelar
 * - Gera Google Meet links automaticamente
 */

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  conferenceData?: {
    createRequest: { requestId: string; conferenceSolutionKey: { type: string } };
  };
}

interface CreatedEvent {
  id: string;
  meetLink?: string;
}

// ---------------------------------------------------------------------------
// Obtém um access_token válido (refresh automático se expirado)
// ---------------------------------------------------------------------------
async function getValidAccessToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: number | null
): Promise<string> {
  const bufferMs = 5 * 60 * 1000; // renova 5min antes de expirar
  const isExpired = expiresAt
    ? Date.now() > expiresAt * 1000 - bufferMs
    : false;

  if (!isExpired) return accessToken;

  // Refresh
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error("Falha ao renovar token do Google.");
  const data = await res.json();
  return data.access_token as string;
}

// ---------------------------------------------------------------------------
// Cria evento no Google Calendar do prestador
// ---------------------------------------------------------------------------
export async function createCalendarEvent(opts: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  calendarId: string;
  title: string;
  description: string;
  startAt: string;       // ISO 8601
  endAt: string;         // ISO 8601
  timezone: string;      // IANA timezone
  attendeeEmail: string;
  attendeeName: string;
  createMeetLink: boolean;
}): Promise<CreatedEvent> {
  const token = await getValidAccessToken(
    opts.accessToken,
    opts.refreshToken,
    opts.expiresAt
  );

  const event: CalendarEvent = {
    summary: opts.title,
    description: opts.description,
    start: { dateTime: opts.startAt, timeZone: opts.timezone },
    end: { dateTime: opts.endAt, timeZone: opts.timezone },
    attendees: [{ email: opts.attendeeEmail, displayName: opts.attendeeName }],
  };

  if (opts.createMeetLink) {
    event.conferenceData = {
      createRequest: {
        requestId: `agendaai-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const params = opts.createMeetLink ? "?conferenceDataVersion=1" : "";
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(opts.calendarId)}/events${params}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar create error: ${err}`);
  }

  const data = await res.json();
  const meetLink = data.conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string; uri: string }) => ep.entryPointType === "video"
  )?.uri as string | undefined;

  return { id: data.id as string, meetLink };
}

// ---------------------------------------------------------------------------
// Remove evento do Google Calendar (ao cancelar)
// ---------------------------------------------------------------------------
export async function deleteCalendarEvent(opts: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  const token = await getValidAccessToken(
    opts.accessToken,
    opts.refreshToken,
    opts.expiresAt
  );

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(opts.calendarId)}/events/${opts.eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

// ---------------------------------------------------------------------------
// Busca eventos ocupados num intervalo (para verificação de disponibilidade)
// ---------------------------------------------------------------------------
export async function getBusyTimes(opts: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  calendarId: string;
  timeMin: string; // ISO 8601
  timeMax: string; // ISO 8601
}): Promise<Array<{ start: string; end: string }>> {
  const token = await getValidAccessToken(
    opts.accessToken,
    opts.refreshToken,
    opts.expiresAt
  );

  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: opts.timeMin,
      timeMax: opts.timeMax,
      items: [{ id: opts.calendarId }],
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.calendars?.[opts.calendarId]?.busy ?? []) as Array<{
    start: string;
    end: string;
  }>;
}
