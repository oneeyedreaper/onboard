import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
    sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@onboard.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Onboard';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================
// EMAIL TEMPLATES
// ============================================

const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .card {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo-text {
            font-size: 28px;
            font-weight: 700;
            color: #6366f1;
        }
        h1 {
            color: #18181b;
            font-size: 24px;
            margin: 0 0 20px 0;
        }
        p {
            color: #52525b;
            margin: 0 0 20px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .button:hover {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e7;
            color: #71717a;
            font-size: 14px;
        }
        .link {
            color: #6366f1;
            word-break: break-all;
        }
        .warning {
            background: #fef3c7;
            border-radius: 8px;
            padding: 16px;
            color: #92400e;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">
                <span class="logo-text">🚀 Onboard</span>
            </div>
            ${content}
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Onboard. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

// ============================================
// EMAIL FUNCTIONS
// ============================================

interface EmailResult {
    success: boolean;
    error?: string;
}

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (
    email: string,
    firstName: string,
    token: string
): Promise<EmailResult> => {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

    // Always log verification URL for development/debugging
    console.log(`🔗 Verification link for ${email}: ${verificationUrl}`);

    const content = `
        <h1>Verify your email address</h1>
        <p>Hi ${firstName},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p class="link">${verificationUrl}</p>
        <div class="warning">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </div>
    `;

    return sendEmail(email, 'Verify your email - Onboard', getBaseTemplate(content));
};

/**
 * Send password reset link
 */
export const sendPasswordResetEmail = async (
    email: string,
    firstName: string,
    token: string
): Promise<EmailResult> => {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    // Always log reset URL for development/debugging
    console.log(`🔗 Password reset link for ${email}: ${resetUrl}`);

    const content = `
        <h1>Reset your password</h1>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p class="link">${resetUrl}</p>
        <div class="warning">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </div>
    `;

    return sendEmail(email, 'Reset your password - Onboard', getBaseTemplate(content));
};

/**
 * Send welcome email after verification
 */
export const sendWelcomeEmail = async (
    email: string,
    firstName: string
): Promise<EmailResult> => {
    const dashboardUrl = `${APP_URL}/dashboard`;

    const content = `
        <h1>Welcome to Onboard! 🎉</h1>
        <p>Hi ${firstName},</p>
        <p>Your email has been verified and your account is now active. You can start using Onboard right away!</p>
        <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
        </div>
        <p>Need help getting started? Check out our onboarding wizard to complete your profile.</p>
    `;

    return sendEmail(email, 'Welcome to Onboard! 🎉', getBaseTemplate(content));
};

/**
 * Core email sending function
 */
const sendEmail = async (
    to: string,
    subject: string,
    html: string
): Promise<EmailResult> => {
    // If no API key, log to console (development mode)
    if (!apiKey) {
        console.log(`📧 [DEV] Email to ${to}:`);
        console.log(`   Subject: ${subject}`);
        console.log(`   (Email not sent - SENDGRID_API_KEY not configured)`);
        return { success: true };
    }

    try {
        await sgMail.send({
            to,
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME,
            },
            subject,
            html,
        });

        console.log(`📧 Email sent to ${to}: ${subject}`);
        return { success: true };
    } catch (error: any) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }
};

export default {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
};
