export interface CalendarExportParams {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location?: string;
}

export function generateICS(params: CalendarExportParams): string {
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Vrutta//Event Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(new Date(params.startDate))}`,
        `DTEND:${formatDate(new Date(params.endDate))}`,
        `SUMMARY:${params.title}`,
        `DESCRIPTION:${params.description.replace(/\n/g, '\\n')}`,
        params.location ? `LOCATION:${params.location}` : '',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    return icsContent;
}

export function downloadICSFile(params: CalendarExportParams) {
    const icsData = generateICS(params);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function getGoogleCalendarLink(params: CalendarExportParams): string {
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = `&text=${encodeURIComponent(params.title)}`;
    const dates = `&dates=${formatDate(new Date(params.startDate))}/${formatDate(new Date(params.endDate))}`;
    const details = `&details=${encodeURIComponent(params.description)}`;
    const location = params.location ? `&location=${encodeURIComponent(params.location)}` : '';

    return `${base}${text}${dates}${details}${location}`;
}
