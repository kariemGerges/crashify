// ============================================
// FILE: /lib/services/sms-service.ts
// ============================================

export interface ClaimLinkSMS {
    to: string;
    claimLink: string;
    expiresInHours: number;
}

export class SMSService {
    /**
     * Send claim access link via SMS
     * Integrate with Twilio, AWS SNS, etc.
     */
    static async sendClaimLink(params: ClaimLinkSMS): Promise<boolean> {
        const { to, claimLink, expiresInHours } = params;

        const message = `Your secure claim link: ${claimLink}\n\nExpires in ${expiresInHours}h. Single use only. Do not share.`;

        // Example with Twilio:
        // await twilioClient.messages.create({
        //   body: message,
        //   to,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        // });

        console.log('SMS sent to:', to);
        console.log('Message:', message);

        return true;
    }
}
