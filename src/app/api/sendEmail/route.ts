import { NextRequest, NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import { isValidEmail } from '@/server/lib/utils/security';

function escapeHtml(value: string | undefined | null): string {
    if (!value) return '';
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function POST(request: NextRequest) {
    try {
        const {
            FirstName,
            LastName,
            email,
            phone,
            company,
            userType,
            inquiryType,
            message,
            recaptchaToken,
        } = await request.json();
        const name = `${FirstName} ${LastName}`;

        // Basic input validation
        if (!FirstName || !LastName || !email || !message) {
            return NextResponse.json(
                { error: 'First name, last name, email and message are required' },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        const MAX_MESSAGE_LENGTH = 5000;
        if (typeof message !== 'string' || message.length === 0) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                { error: 'Message is too long' },
                { status: 400 }
            );
        }

        // Optional reCAPTCHA verification (mirrors login flow)
        if (recaptchaToken) {
            try {
                const recaptchaResponse = await fetch(
                    `${request.nextUrl.origin}/api/auth/verify-recaptcha`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: recaptchaToken }),
                    }
                );

                if (!recaptchaResponse.ok) {
                    const recaptchaError = await recaptchaResponse.json();
                    return NextResponse.json(
                        {
                            error:
                                recaptchaError.error ||
                                'reCAPTCHA verification failed',
                        },
                        { status: 400 }
                    );
                }
            } catch (recaptchaError) {
                console.error(
                    '[CONTACT] reCAPTCHA verification error:',
                    recaptchaError
                );
                // Do not block if reCAPTCHA service is unavailable
            }
        }

        const apiInstance = new TransactionalEmailsApi();
        apiInstance.setApiKey(0, process.env.brevo_API_KEY as string);

        const sendSmtpEmail = new SendSmtpEmail();

        const safeFirstName = escapeHtml(FirstName);
        const safeLastName = escapeHtml(LastName);
        const safeName = `${safeFirstName} ${safeLastName}`.trim();
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone);
        const safeCompany = escapeHtml(company);
        const safeUserType = escapeHtml(userType);
        const safeInquiryType = escapeHtml(inquiryType);
        const safeMessage = escapeHtml(message);

        sendSmtpEmail.subject = `📬 New Contact Message from ${safeName}`;
        sendSmtpEmail.sender = { name, email: 'kariem.gerges@outlook.com' };
        sendSmtpEmail.to = [{ email: 'info@crashify.com.au' }]; // production
        // sendSmtpEmail.to = [{ email: 'crashifyai@gmail.com' }]; // testing

        // ✨ Professional HTML Email
        sendSmtpEmail.htmlContent = `
      <html>
        <body style="background-color:#f4f6f8; margin:0; padding:40px; font-family:'Segoe UI', Arial, sans-serif;">
          <table style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 8px rgba(0,0,0,0.05);">
            <tr style="background-color:#DC2626; color:#ffffff;">
              <td style="padding:20px 30px; text-align:center;">
                <h1 style="margin:0; font-size:22px;">🚗 New Vehicle Assessment Inquiry</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="font-size:16px; color:#333;">Hello Crashify Team,</p>
                <p style="font-size:15px; color:#555;">You have received a new inquiry from your contact form. Here are the details:</p>

                <table style="width:100%; margin-top:20px; border-collapse:collapse;">
                  <tr style="background-color:#f9fafb;">
                    <td colspan="2" style="padding:12px; font-weight:bold; color:#DC2626; border-bottom:2px solid #DC2626;">Contact Information</td>
                  </tr>
                  <tr>
                    <td style="padding:10px; font-weight:bold; color:#333; width:35%;">Name:</td>
                    <td style="padding:10px; color:#555;">${safeName}</td>
                  </tr>
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:10px; font-weight:bold; color:#333;">Email:</td>
                    <td style="padding:10px; color:#555;">${safeEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px; font-weight:bold; color:#333;">Phone:</td>
                    <td style="padding:10px; color:#555;">${safePhone}</td>
                  </tr>
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:10px; font-weight:bold; color:#333;">Company:</td>
                    <td style="padding:10px; color:#555;">${
                        safeCompany || 'Not provided'
                    }</td>
                  </tr>
                  
                  <tr>
                    <td colspan="2" style="padding:12px 12px 12px 12px; font-weight:bold; color:#DC2626; border-bottom:2px solid #DC2626; border-top:2px solid #e5e7eb; margin-top:15px;">Inquiry Details</td>
                  </tr>
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:10px; font-weight:bold; color:#333;">Client Type:</td>
                    <td style="padding:10px; color:#555;">${userType}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px; font-weight:bold; color:#333;">Inquiry Type:</td>
                    <td style="padding:10px; color:#555;">${inquiryType}</td>
                  </tr>
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:10px; font-weight:bold; color:#333; vertical-align:top;">Message:</td>
                    <td style="padding:10px; color:#555; line-height:1.6;">${safeMessage}</td>
                  </tr>
                </table>

                <div style="margin-top:30px; text-align:center;">
                  <a href="mailto:${safeEmail}" style="background-color:#DC2626; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:15px; display:inline-block; margin-right:10px;">📧 Reply to ${safeFirstName}</a>
                  <a href="tel:${safePhone}" style="background-color:#0078D4; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:15px; display:inline-block;">📞 Call ${safeFirstName}</a>
                </div>
              </td>
            </tr>
            <tr style="background-color:#f0f2f5;">
              <td style="padding:15px 30px; text-align:center; color:#888; font-size:13px;">
                <p style="margin:0;">This message was sent from Crashify contact form.</p>
                <p style="margin:5px 0 0 0; font-size:12px;">🇦🇺 Vehicle Assessment Services Australia-Wide</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);

        return NextResponse.json(
            { message: 'Email sent successfully' },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Error sending email' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ message: 'server-backend is running' });
}
