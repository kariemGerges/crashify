import { NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.brevo_API_KEY as string);

export async function POST(request: Request) {
    try {
        const { FirstName, LastName, email, message } = await request.json();
        const name = `${FirstName} ${LastName}`;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const sendSmtpEmail = new SendSmtpEmail();

        sendSmtpEmail.subject = `📬 New Contact Message from ${name}`;
        sendSmtpEmail.sender = { name, email: email as string };
        sendSmtpEmail.to = [{ email: 'info@crashify.com.au' }];

        // ✨ Professional HTML Email
        sendSmtpEmail.htmlContent = `
      <html>
        <body style="background-color:#f4f6f8; margin:0; padding:40px; font-family:'Segoe UI', Arial, sans-serif;">
          <table style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 8px rgba(0,0,0,0.05);">
            <tr style="background-color:#0078D4; color:#ffffff;">
              <td style="padding:20px 30px; text-align:center;">
                <h1 style="margin:0; font-size:22px;">New Contact Message</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="font-size:16px; color:#333;">Hello Kariem,</p>
                <p style="font-size:15px; color:#555;">You have received a new message from your contact form. Here are the details:</p>

                <table style="width:100%; margin-top:20px; border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0; font-weight:bold; color:#333;">Name:</td>
                    <td style="padding:8px 0; color:#555;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-weight:bold; color:#333;">Email:</td>
                    <td style="padding:8px 0; color:#555;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-weight:bold; color:#333;">Message:</td>
                    <td style="padding:8px 0; color:#555;">${message}</td>
                  </tr>
                </table>

                <div style="margin-top:30px; text-align:center;">
                  <a href="mailto:${email}" style="background-color:#0078D4; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-size:15px;">Reply to ${FirstName}</a>
                </div>
              </td>
            </tr>
            <tr style="background-color:#f0f2f5;">
              <td style="padding:15px 30px; text-align:center; color:#888; font-size:13px;">
                <p style="margin:0;">This message was sent from your website contact form.</p>
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
