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
        // For Brevo, port 587 with STARTTLS is secure: false
        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // Only 465 is implicit SSL/TLS
            auth: { user, pass }
        });
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

// ────── Email layout & styling ───────────────────────────────────────────────

const accentColor = '#7c3aed';

function baseLayout(title: string, content: string) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;color:#1f2937;">
        <div style="background-color:#f9fafb;padding:48px 16px;">
            <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);border:1px solid #f3f4f6;">
                <!-- Header -->
                <div style="padding:40px 40px 0;text-align:center;">
                    <div style="display:inline-block;width:64px;height:64px;">
                        <img src="${process.env.NEXT_PUBLIC_APP_URL}/auth/logo-small.svg" width="64" height="64" alt="Group Ad Logo" style="display:block;width:64px;height:64px;border:0;" />
                    </div>
                    <div style="margin-top:12px;">
                        <span style="font-size:18px;font-weight:800;color:${accentColor};letter-spacing:-0.5px;text-transform:uppercase;">Group Ad</span>
                    </div>
                </div>

                <!-- Main Content -->
                <div style="padding:40px;">
                    ${content}
                </div>

                <!-- Footer -->
                <div style="padding:0 40px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                        This is an automated message from Group Ad.<br/>
                        Connect with top professionals and expand your network.
                    </p>
                    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #f3f4f6;">
                        <p style="margin:0;color:#9ca3af;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">
                        &copy; ${new Date().getFullYear()} Group Ad. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

// ────── Email templates ──────────────────────────────────────────────────────

export function welcomeEmail(name: string, email: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login?identifier=${encodeURIComponent(email)}`;
    
    const content = `
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;text-align:center;">Welcome, ${name}!</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;text-align:center;">
        We're thrilled to have you join our community. Your professional journey on Group Ad starts here.
    </p>
    <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(124, 58, 237, 0.2);transition:background-color 0.2s;">Get Started Now</a>
    </div>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;text-align:center;">
        Explore our groups and events to start networking today!
    </p>`;

    return baseLayout('Welcome to Group Ad!', content);
}

export function bulkAccountCreatedEmail(name: string, username: string, email: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login?identifier=${encodeURIComponent(email)}`;
    
    const content = `
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;text-align:center;">Account Ready!</h1>
    <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#4b5563;text-align:center;">
        Hello ${name}, your administrator has created an account for you on Group Ad.
    </p>
    
    <div style="background-color:#f9fafb;border-radius:16px;padding:24px;border:1px solid #f3f4f6;margin-bottom:32px;">
      <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:700;">Account Details</h3>
      <p style="margin:0;font-size:15px;color:#374151;"><strong>Email:</strong> ${email}</p>
    </div>

    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
        Please log in to your account and reset your password to personalize your profile.
    </p>

    <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(124, 58, 237, 0.2);">Log In to Your Account</a>
    </div>

    <p style="margin:0;font-size:14px;line-height:1.6;color:#9ca3af;text-align:center;font-style:italic;">
        Need help? Reply to this email or contact your administrator.
    </p>`;

    return baseLayout('Account Created - Group Ad', content);
}

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
