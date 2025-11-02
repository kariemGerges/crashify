import { NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

export async function POST(request: Request) {
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
        } = await request.json();
        const name = `${FirstName} ${LastName}`;

        const apiInstance = new TransactionalEmailsApi();
        apiInstance.setApiKey(0, process.env.brevo_API_KEY as string);

        // Temporary debug logging
        console.log('Environment check:', {
            hasApiKey: !!process.env.brevo_API_KEY,
            keyPrefix: process.env.brevo_API_KEY?.substring(0, 10) || 'MISSING',
        });

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const sendSmtpEmail = new SendSmtpEmail();

        sendSmtpEmail.subject = `📬 New Contact Message from ${name}`;
        sendSmtpEmail.sender = { name, email: 'kariem.gerges@outlook.com' };
        // sendSmtpEmail.to = [{ email: 'info@crashify.com.au' }]; // production
        sendSmtpEmail.to = [{ email: 'crashifyai@gmail.com' }]; // testing

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
                    <td style="padding:10px; color:#555;">${FirstName} ${LastName}</td>
                  </tr>
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:10px; font-weight:bold; color:#333;">Email:</td>
                    <td style="padding:10px; color:#555;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px; font-weight:bold; color:#333;">Phone:</td>
                    <td style="padding:10px; color:#555;">${phone}</td>
                  </tr>
                  <tr style="background-color:#f9fafb;">
                    <td style="padding:10px; font-weight:bold; color:#333;">Company:</td>
                    <td style="padding:10px; color:#555;">${
                        company || 'Not provided'
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
                    <td style="padding:10px; color:#555; line-height:1.6;">${message}</td>
                  </tr>
                </table>

                <div style="margin-top:30px; text-align:center;">
                  <a href="mailto:${email}" style="background-color:#DC2626; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:15px; display:inline-block; margin-right:10px;">📧 Reply to ${FirstName}</a>
                  <a href="tel:${phone}" style="background-color:#0078D4; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-size:15px; display:inline-block;">📞 Call ${FirstName}</a>
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
