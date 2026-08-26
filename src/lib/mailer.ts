import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

let resend: Resend | null = null;

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        logger.warn('[mailer] Missing RESEND_API_KEY configuration');
        return null;
    }
    if (!resend) {
        resend = new Resend(apiKey);
    }
    return resend;
}

const getFromAddress = () => process.env.EMAIL_FROM || 'Vrutta <onboarding@resend.dev>';

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
    logger.info('[mailer] Attempting to send email to', { to });
    logger.info('[mailer] Using APP_URL', { appUrl: process.env.NEXT_PUBLIC_APP_URL });
    const client = getResendClient();
    if (!client) {
        const error = new Error('Email API configuration is missing');
        logger.error('[mailer] Email configuration error', error);
        throw error;
    }
    try {
        const from = getFromAddress();
        const { data, error } = await client.emails.send({ from, to, subject, html });
        if (error) {
            throw new Error(error.message);
        }
        logger.info('[mailer] Email sent successfully', { id: data?.id });
        return data;
    } catch (err) {
        logger.error('[mailer] Failed to send email', err);
        throw err; // Rethrow to let the API handle it
    }
}

// ────── Email layout & styling ───────────────────────────────────────────────

const accentColor = '#7c3aed';

/**
 * Centralized logic to resolve the application's base URL.
 * Prioritizes NEXT_PUBLIC_APP_URL, then VERCEL_URL, then request headers.
 */
export function getAppBaseUrl(req?: Request | NextRequest) {
    // 1. First, check request headers if req is provided to support dynamic/custom domains (e.g. vrutta.net)
    if (req) {
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
        if (host) {
            return `${protocol}://${host}`.replace(/\/$/, '');
        }
    }

    // 2. Fallback to explicit environment variable
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    // 3. Fallback to Vercel's automatic environment variable
    if (!baseUrl && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
    }

    // 4. Final fallback
    baseUrl = baseUrl || 'http://localhost:3000';

    // Remove trailing slash if present to prevent double slashes in paths
    return baseUrl.replace(/\/$/, '');
}

function baseLayout(title: string, content: string, baseUrl?: string) {
    const finalBaseUrl = baseUrl || getAppBaseUrl();
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${title}</title>
        <style>
            /* Dynamic theme color styles based on system preferences */
            @media (prefers-color-scheme: dark) {
                .email-bg {
                    background-color: #0b0f19 !important;
                }
                .email-card {
                    background-color: #111827 !important;
                    border-color: #1f2937 !important;
                }
                .logo-light {
                    display: none !important;
                }
                .logo-dark {
                    display: block !important;
                }
                .text-title {
                    color: #ffffff !important;
                }
                .text-body {
                    color: #d1d5db !important;
                }
                .text-footer {
                    color: #9ca3af !important;
                }
                .border-separator {
                    border-color: #1f2937 !important;
                }
                .details-box {
                    background-color: #1f2937 !important;
                    border-color: #374151 !important;
                }
                .details-text {
                    color: #f3f4f6 !important;
                }
            }
        </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;color:#1f2937;">
        <div class="email-bg" style="background-color:#f9fafb;padding:48px 16px;">
            <div class="email-card" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05);border:1px solid #f3f4f6;">
                <!-- Header -->
                <div class="border-separator" style="padding:40px 40px 0;text-align:center;">
                    <div style="display:inline-block;vertical-align:middle;width:36px;height:36px;">
                        <!-- Light Mode Logo -->
                        <img class="logo-light" src="${finalBaseUrl}/auth/logo-small.svg" width="36" height="36" alt="Vrutta" style="display:block;width:36px;height:36px;border:0;" />
                        <!-- Dark Mode Logo (hidden by default) -->
                        <!--[if !mso]><!-->
                        <img class="logo-dark" src="${finalBaseUrl}/auth/logo-small-dark.svg" width="36" height="36" alt="Vrutta" style="display:none;width:36px;height:36px;border:0;" />
                        <!--<![endif]-->
                    </div>
                    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:22px;font-weight:800;color:${accentColor};letter-spacing:-0.5px;">Vrutta</span>
                </div>

                <!-- Main Content -->
                <div style="padding:40px;">
                    ${content}
                </div>

                <!-- Footer -->
                <div class="border-separator" style="padding:0 40px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p class="text-footer" style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                        This is an automated message from Vrutta.<br/>
                        Connect with top professionals and expand your connections.
                    </p>
                    <div class="border-separator" style="margin-top:20px;padding-top:20px;border-top:1px solid #f3f4f6;">
                        <p style="margin:0;color:#9ca3af;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">
                        &copy; ${new Date().getFullYear()} Vrutta. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

// ────── Email templates ──────────────────────────────────────────────────────

export function welcomeEmail(name: string, email: string, baseUrl?: string) {
    const finalBaseUrl = baseUrl || getAppBaseUrl();
    const loginUrl = `${finalBaseUrl}/login?identifier=${encodeURIComponent(email)}`;
    
    const content = `
    <h1 class="text-title" style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;text-align:center;">Welcome, ${name}!</h1>
    <p class="text-body" style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;text-align:center;">
        We're thrilled to have you join our community. Your professional journey on Vrutta starts here.
    </p>
    <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(124, 58, 237, 0.2);transition:background-color 0.2s;">Get Started Now</a>
    </div>
    <p class="text-footer" style="margin:0;font-size:15px;line-height:1.6;color:#6b7280;text-align:center;">
        Explore our groups and events to start connecting today!
    </p>`;

    return baseLayout('Welcome to Vrutta!', content, finalBaseUrl);
}

export function passwordResetEmail(name: string, token: string, baseUrl?: string) {
    const finalBaseUrl = baseUrl || getAppBaseUrl();
    const resetUrl = `${finalBaseUrl}/auth/reset-password?token=${token}`;
    
    const content = `
    <h1 class="text-title" style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;text-align:center;">Reset Your Password</h1>
    <p class="text-body" style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5563;text-align:center;">
        You requested to reset your password for your Vrutta account. Click the button below to set a new password.
    </p>
    <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(124, 58, 237, 0.2);">Reset Password</a>
    </div>
    <p class="text-footer" style="margin:0;font-size:14px;line-height:1.6;color:#9ca3af;text-align:center;">
        If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
    </p>
    <div class="border-separator" style="margin-top:24px;padding-top:24px;border-top:1px dashed #e5e7eb;word-break:break-all;font-size:12px;color:#9ca3af;text-align:center;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:${accentColor};text-decoration:none;">${resetUrl}</a>
    </div>`;

    return baseLayout('Reset Password - Vrutta', content, finalBaseUrl);
}

export function bulkAccountCreatedEmail(name: string, username: string, email: string, baseUrl?: string) {
    const finalBaseUrl = baseUrl || getAppBaseUrl();
    const loginUrl = `${finalBaseUrl}/login?identifier=${encodeURIComponent(email)}`;
    
    const content = `
    <h1 class="text-title" style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;text-align:center;">Account Ready!</h1>
    <p class="text-body" style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#4b5563;text-align:center;">
        Hello ${name}, your administrator has created an account for you on Vrutta.
    </p>
    
    <div class="details-box" style="background-color:#f9fafb;border-radius:16px;padding:24px;border:1px solid #f3f4f6;margin-bottom:32px;">
      <h3 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:700;">Account Details</h3>
      <p class="details-text" style="margin:0;font-size:15px;color:#374151;"><strong>Email:</strong> ${email}</p>
    </div>

    <p class="text-body" style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
        Please log in to your account and reset your password to personalize your profile.
    </p>

    <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(124, 58, 237, 0.2);">Log In to Your Account</a>
    </div>

    <p class="text-footer" style="margin:0;font-size:14px;line-height:1.6;color:#9ca3af;text-align:center;font-style:italic;">
        Need help? Reply to this email or contact your administrator.
    </p>`;

    return baseLayout('Account Created - Vrutta', content, finalBaseUrl);
}

export function enrollmentConfirmationEmail(eventTitle: string, eventDate: string, baseUrl?: string) {
    const content = `
    <div style="text-align:center;">
      <h2 style="color:${accentColor};margin-bottom:16px;">🎉 Enrollment Received!</h2>
      <p class="text-body" style="color:#374151;font-size:16px;line-height:1.6;">You've successfully enrolled in <strong>${eventTitle}</strong>.</p>
      <p class="text-footer" style="color:#6b7280;font-size:15px;line-height:1.6;">Your enrollment is <strong>pending admin approval</strong>. You'll receive another email once it's approved.</p>
      <div class="details-box" style="background:#f5f3ff;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #ddd6fe;">
        <p style="margin:0;color:#6d28d9;font-weight:700;font-size:16px;">📅 ${eventDate}</p>
      </div>
      <p class="text-footer" style="color:#9ca3af;font-size:13px;">If you have any questions, reply to this email or visit Vrutta.</p>
    </div>`;
    return baseLayout('Enrollment Received - Vrutta', content, baseUrl);
}

export function enrollmentApprovalEmail(eventTitle: string, eventDate: string, meetingLink?: string | null, baseUrl?: string) {
    const content = `
    <div style="text-align:center;">
      <h2 style="color:#059669;margin-bottom:16px;">✅ Enrollment Approved!</h2>
      <p class="text-body" style="color:#374151;font-size:16px;line-height:1.6;">Great news! Your enrollment for <strong>${eventTitle}</strong> has been approved.</p>
      <div class="details-box" style="background:#ecfdf5;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #a7f3d0;">
        <p style="margin:0 0 10px;color:#065f46;font-weight:700;font-size:16px;">📅 ${eventDate}</p>
        ${meetingLink ? `<p style="margin:12px 0 0;"><a href="${meetingLink}" style="color:#059669;font-weight:700;text-decoration:underline;">🔗 Join Meeting Link</a></p>` : ''}
      </div>
      <p class="text-footer" style="color:#6b7280;font-size:14px;">See you there! — The Vrutta Team</p>
    </div>`;
    return baseLayout('Enrollment Approved - Vrutta', content, baseUrl);
}

export function eventReminderEmail(eventTitle: string, eventDate: string, timeUnit: string, meetingLink?: string | null, baseUrl?: string) {
    const content = `
    <div style="text-align:center;">
      <h2 style="color:#d97706;margin-bottom:16px;">⏰ Event Reminder</h2>
      <p class="text-body" style="color:#374151;font-size:16px;line-height:1.6;"><strong>${eventTitle}</strong> starts in <strong>${timeUnit}</strong>!</p>
      <div class="details-box" style="background:#fffbeb;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #fde68a;">
        <p style="margin:0 0 10px;color:#92400e;font-weight:700;font-size:16px;">📅 ${eventDate}</p>
        ${meetingLink ? `<p style="margin:12px 0 0;"><a href="${meetingLink}" style="color:#d97706;font-weight:700;text-decoration:underline;">🔗 Join Meeting Link</a></p>` : ''}
      </div>
      <p class="text-footer" style="color:#6b7280;font-size:14px;">See you soon! — The Vrutta Team</p>
    </div>`;
    return baseLayout('Event Reminder - Vrutta', content, baseUrl);
}

export function meetingInviteEmail(
    requesterName: string,
    proposedDate: string,
    agenda: string | null | undefined,
    eventsUrl: string,
    baseUrl?: string
) {
    const content = `
    <div style="text-align:center;">
      <h2 style="color:${accentColor};margin-bottom:16px;">📹 New 1:1 Meeting Request</h2>
      <p class="text-body" style="color:#374151;font-size:16px;line-height:1.6;">
        <strong>${requesterName}</strong> has requested a 1:1 meeting with you on Vrutta.
      </p>
      <div class="details-box" style="background:#f5f3ff;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #ddd6fe;text-align:left;">
        <p style="margin:0 0 8px;color:#6d28d9;font-weight:700;font-size:15px;">📅 Proposed Time</p>
        <p style="margin:0;color:#374151;font-size:15px;">${proposedDate}</p>
        ${agenda ? `
        <p style="margin:16px 0 8px;color:#6d28d9;font-weight:700;font-size:15px;">📝 Agenda</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${agenda}</p>` : ''}
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${eventsUrl}" style="display:inline-block;background-color:${accentColor};color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(124, 58, 237, 0.2);">
          View &amp; Respond
        </a>
      </div>
      <p class="text-footer" style="color:#9ca3af;font-size:13px;">
        Open the Events page on Vrutta and switch to the <strong>1:1 Meetings</strong> tab to accept or decline.
      </p>
    </div>`;
    return baseLayout('New Meeting Request - Vrutta', content, baseUrl);
}

export function meetingAcceptedEmail(
    receiverName: string,
    proposedDate: string,
    agenda: string | null | undefined,
    eventsUrl: string,
    baseUrl?: string
) {
    const content = `
    <div style="text-align:center;">
      <h2 style="color:#059669;margin-bottom:16px;">✅ Meeting Request Accepted!</h2>
      <p class="text-body" style="color:#374151;font-size:16px;line-height:1.6;">
        <strong>${receiverName}</strong> has accepted your 1:1 meeting request.
      </p>
      <div class="details-box" style="background:#ecfdf5;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #a7f3d0;text-align:left;">
        <p style="margin:0 0 8px;color:#065f46;font-weight:700;font-size:15px;">📅 Confirmed Time</p>
        <p style="margin:0;color:#374151;font-size:15px;">${proposedDate}</p>
        ${agenda ? `
        <p style="margin:16px 0 8px;color:#065f46;font-weight:700;font-size:15px;">📝 Agenda</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${agenda}</p>` : ''}
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${eventsUrl}" style="display:inline-block;background-color:#059669;color:#ffffff;padding:16px 36px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 6px -1px rgba(5, 150, 105, 0.2);">
          View My Meetings
        </a>
      </div>
      <p class="text-footer" style="color:#9ca3af;font-size:13px;">See you there! — The Vrutta Team</p>
    </div>`;
    return baseLayout('Meeting Accepted - Vrutta', content, baseUrl);
}
