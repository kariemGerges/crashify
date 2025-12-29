// =============================================
// FILE: lib/services/microsoft-graph-auth.ts
// Microsoft Graph OAuth2 Authentication Service
// Supports both Client Credentials (app-only) and Delegated permissions
// =============================================

import {
    ConfidentialClientApplication,
    ClientCredentialRequest,
    OnBehalfOfRequest,
    AuthenticationResult,
} from '@azure/msal-node';
import { createLogger } from '@/server/lib/utils/logger';

const logger = createLogger('MicrosoftGraphAuth');

/**
 * Microsoft Graph OAuth2 Authentication Service
 * Handles authentication for Microsoft Graph API using OAuth2
 */
export class MicrosoftGraphAuth {
    private static instance: MicrosoftGraphAuth | null = null;
    private msalClient: ConfidentialClientApplication | null = null;
    private cachedToken: {
        accessToken: string;
        expiresAt: number;
    } | null = null;

    private constructor() {
        this.initializeMsalClient();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): MicrosoftGraphAuth {
        if (!MicrosoftGraphAuth.instance) {
            MicrosoftGraphAuth.instance = new MicrosoftGraphAuth();
        }
        return MicrosoftGraphAuth.instance;
    }

    /**
     * Initialize MSAL client with configuration from environment variables
     */
    private initializeMsalClient(): void {
        const clientId = process.env.MICROSOFT_CLIENT_ID;
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

        if (!clientId || !clientSecret) {
            throw new Error(
                'Microsoft Graph OAuth2 configuration missing. Please set:\n' +
                    '- MICROSOFT_CLIENT_ID (Azure App Registration Application ID)\n' +
                    '- MICROSOFT_CLIENT_SECRET (Azure App Registration Client Secret VALUE, not ID)\n' +
                    '- MICROSOFT_TENANT_ID (optional, defaults to "common")\n\n' +
                    'To set up:\n' +
                    '1. Go to https://portal.azure.com\n' +
                    '2. Navigate to Azure Active Directory > App registrations\n' +
                    '3. Create a new app registration or use existing\n' +
                    '4. Go to Certificates & secrets > New client secret\n' +
                    '5. IMPORTANT: Copy the VALUE (not the ID) - it looks like "abc~DEF123..."\n' +
                    '6. Go to API permissions > Add permission > Microsoft Graph\n' +
                    '7. Add permissions: Mail.Read, Mail.ReadWrite\n' +
                    '8. Grant admin consent for your organization'
            );
        }
        
        // Validate client secret format (warn if it looks like a Secret ID instead of Value)
        // Secret IDs are UUIDs, Secret Values contain special characters like ~, -, etc.
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(clientSecret.trim())) {
            logger.warn('Client secret looks like a Secret ID (UUID), not a Secret Value', {
                message: 'You need the VALUE, not the ID. Check your .env.local file.',
            });
        }

        this.msalClient = new ConfidentialClientApplication({
            auth: {
                clientId,
                clientSecret,
                authority: `https://login.microsoftonline.com/${tenantId}`,
            },
        });
    }

    /**
     * Get access token using Client Credentials flow (app-only authentication)
     * This is recommended for server-side applications
     */
    async getAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        if (
            this.cachedToken &&
            this.cachedToken.expiresAt > Date.now() + 60000
        ) {
            // Return cached token if it's still valid (with 1 minute buffer)
            return this.cachedToken.accessToken;
        }

        if (!this.msalClient) {
            this.initializeMsalClient();
            if (!this.msalClient) {
                throw new Error('Failed to initialize MSAL client');
            }
        }

        const request: ClientCredentialRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };

        try {
            const response: AuthenticationResult | null =
                await this.msalClient.acquireTokenByClientCredential(request);

            if (!response || !response.accessToken) {
                throw new Error('Failed to acquire access token');
            }

            // Cache the token (expires in ~1 hour, cache for 50 minutes)
            this.cachedToken = {
                accessToken: response.accessToken,
                expiresAt: Date.now() + (response.expiresOn?.getTime() || Date.now() + 3600000) - Date.now() - 600000,
            };

            logger.debug('Successfully acquired access token');
            return response.accessToken;
        } catch (error) {
            logger.error('Error acquiring token', error);
            
            // Provide helpful error messages for common issues
            let errorMessage = 'Failed to acquire Microsoft Graph access token';
            
            if (error && typeof error === 'object' && 'errorCode' in error) {
                const errorCode = (error as { errorCode?: string }).errorCode;
                const errorMsg = (error as { errorMessage?: string }).errorMessage || '';
                
                if (errorCode === 'invalid_client' || errorMsg.includes('AADSTS7000215')) {
                    errorMessage = `Invalid client secret. Common causes:
1. Using Secret ID instead of Secret Value
   - Secret ID looks like: "abc12345-def6-7890-..."
   - Secret Value looks like: "abc~DEF123ghi456JKL789..."
   - You need the VALUE, not the ID
2. Secret has expired
   - Check expiration date in Azure Portal
   - Create a new secret if expired
3. Secret has extra spaces or quotes
   - Remove any quotes around the secret in .env.local
   - Ensure no leading/trailing spaces

To fix:
1. Go to Azure Portal > App registrations > Your app > Certificates & secrets
2. Create a NEW client secret (or use existing if not expired)
3. Copy the VALUE (not the ID) immediately
4. Update MICROSOFT_CLIENT_SECRET in .env.local with the VALUE
5. Restart your development server

Original error: ${errorMsg}`;
                } else if (errorCode === 'invalid_request' || errorMsg.includes('AADSTS700016')) {
                    errorMessage = `Invalid client ID. Verify:
1. MICROSOFT_CLIENT_ID matches the Application (client) ID from Azure Portal
2. The app registration exists and is active
3. No typos in the client ID

Original error: ${errorMsg}`;
                } else {
                    errorMessage = `${errorMessage}: ${errorMsg || errorCode || 'Unknown error'}`;
                }
            } else if (error instanceof Error) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Get access token using On-Behalf-Of flow (delegated permissions)
     * Use this if you need to access emails on behalf of a specific user
     */
    async getAccessTokenOnBehalfOf(
        userAssertion: string
    ): Promise<string> {
        if (!this.msalClient) {
            this.initializeMsalClient();
            if (!this.msalClient) {
                throw new Error('Failed to initialize MSAL client');
            }
        }

        const request: OnBehalfOfRequest = {
            scopes: [
                'https://graph.microsoft.com/Mail.Read',
                'https://graph.microsoft.com/Mail.ReadWrite',
            ],
            oboAssertion: userAssertion,
        };

        try {
            const response: AuthenticationResult | null =
                await this.msalClient.acquireTokenOnBehalfOf(request);

            if (!response || !response.accessToken) {
                throw new Error('Failed to acquire access token on behalf of user');
            }

            return response.accessToken;
        } catch (error) {
            logger.error('Error acquiring token on behalf of user', error);
            throw new Error(
                `Failed to acquire Microsoft Graph access token: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    }

    /**
     * Clear cached token (useful for testing or when credentials change)
     */
    clearCache(): void {
        this.cachedToken = null;
    }
}

