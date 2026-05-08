import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Simple .env parser
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
const envLines = envContent.split('\n');
envLines.forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
});

const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT || '587');
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM;

async function testEmail() {
    console.log('Testing SMTP connection with:');
    console.log('Host:', host);
    console.log('Port:', port);
    console.log('User:', user);
    console.log('Pass:', pass ? '******' : 'MISSING');
    console.log('From:', from);

    if (!host || !user || !pass) {
        console.error('Missing SMTP environment variables!');
        return;
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('Transporter is ready to take messages!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from,
            to: 'manojhegde2001@gmail.com', // Test sending to the user's email
            subject: 'SMTP Test - Vrutta',
            text: 'This is a test email to verify SMTP configuration.',
            html: '<b>This is a test email to verify SMTP configuration.</b>'
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Failed to send test email:', error);
    }
}

testEmail();
