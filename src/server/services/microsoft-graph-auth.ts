/**
 * CICOP Microsoft Graph auth bridge
 * Re-exports token getter for email integration and send-response API
 */
import { MicrosoftGraphAuth } from '@/server/lib/services/microsoft-graph-auth';

export async function getMicrosoftGraphToken(): Promise<{
    accessToken: string;
}> {
    const auth = MicrosoftGraphAuth.getInstance();
    const accessToken = await auth.getAccessToken();
    return { accessToken };
}
