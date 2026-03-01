import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT || '587');
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || '"Group Ad" <no-reply@groupad.com>';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!host || !user || !pass) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    }
    return transporter;
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
    const t = getTransporter();
    if (!t) {
        console.warn('[mailer] Email not configured — skipping send to', to);
        return;
    }
    try {
        await t.sendMail({ from, to, subject, html });
    } catch (err) {
        console.error('[mailer] Failed to send email:', err);
    }
}

// ────── Email templates ──────────────────────────────────────────────────────

export function enrollmentConfirmationEmail(eventTitle: string, eventDate: string) {
    return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#7c3aed;margin-bottom:8px;">🎉 Enrollment Received!</h2>
      <p style="color:#374151;">You've successfully enrolled in <strong>${eventTitle}</strong>.</p>
      <p style="color:#374151;">Your enrollment is <strong>pending admin approval</strong>. You'll receive another email once it's approved.</p>
      <div style="background:#f5f3ff;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;color:#6d28d9;font-weight:600;">📅 ${eventDate}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">If you have any questions, reply to this email or visit Group Ad.</p>
    </div>`;
}

export function enrollmentApprovalEmail(eventTitle: string, eventDate: string, meetingLink?: string | null) {
    return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#059669;margin-bottom:8px;">✅ Enrollment Approved!</h2>
      <p style="color:#374151;">Great news! Your enrollment for <strong>${eventTitle}</strong> has been approved.</p>
      <div style="background:#ecfdf5;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 6px;color:#065f46;font-weight:600;">📅 ${eventDate}</p>
        ${meetingLink ? `<p style="margin:0;"><a href="${meetingLink}" style="color:#059669;">🔗 Join Meeting Link</a></p>` : ''}
      </div>
      <p style="color:#6b7280;font-size:13px;">See you there! — The Group Ad Team</p>
    </div>`;
}

export function eventReminderEmail(eventTitle: string, eventDate: string, timeUnit: string, meetingLink?: string | null) {
    return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#d97706;margin-bottom:8px;">⏰ Event Reminder</h2>
      <p style="color:#374151;"><strong>${eventTitle}</strong> starts in <strong>${timeUnit}</strong>!</p>
      <div style="background:#fffbeb;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 6px;color:#92400e;font-weight:600;">📅 ${eventDate}</p>
        ${meetingLink ? `<p style="margin:0;"><a href="${meetingLink}" style="color:#d97706;">🔗 Join Meeting Link</a></p>` : ''}
      </div>
      <p style="color:#6b7280;font-size:13px;">See you soon! — The Group Ad Team</p>
    </div>`;
}
