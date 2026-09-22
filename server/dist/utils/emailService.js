"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter;
const initTransporter = async () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    else {
        // Generate test account for local development if real SMTP isn't set up
        const testAccount = await nodemailer_1.default.createTestAccount();
        console.log('No SMTP credentials found in .env. Using Ethereal Email for testing.');
        console.log(`Ethereal User: ${testAccount.user}, Pass: ${testAccount.pass}`);
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
};
initTransporter().catch(console.error);
const sendVerificationEmail = async (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"MEIL ESG360" <noreply@meil.com>',
        to,
        subject: 'Verify your Email - MEIL ESG360',
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #0b2239; text-align: center;">Verify Your Email</h2>
        <p style="color: #333;">Hello,</p>
        <p style="color: #333;">Thank you for registering on MEIL ESG360 (Proofly). To complete your registration and log in, please enter the following 4-digit verification code:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff6b6b; background: #fff5f5; padding: 15px 30px; border-radius: 8px;">${code}</span>
        </div>
        <p style="color: #333;">This code will expire in 10 minutes.</p>
        <p style="color: #777; font-size: 12px; text-align: center; margin-top: 40px;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        // Log the Ethereal URL if using test account
        const testUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (testUrl) {
            console.log('Preview URL: %s', testUrl);
        }
        return true;
    }
    catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
