// ============================================
// FILE: /lib/services/email-service.ts
// ============================================

import { Resend } from 'resend';

// ============================================
// Configuration & Types
// ============================================

interface EmailConfig {
    apiKey: string;
    fromEmail: string;
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
}

interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    errorCode?: EmailErrorCode;
}

enum EmailErrorCode {
    INVALID_INPUT = 'INVALID_INPUT',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    API_ERROR = 'API_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================
// Custom Error Classes
// ============================================

export class EmailServiceError extends Error {
    constructor(
        message: string,
        public readonly code: EmailErrorCode,
        public readonly originalError?: unknown,
        public readonly retryable: boolean = false
    ) {
        super(message);
        this.name = 'EmailServiceError';
        Object.setPrototypeOf(this, EmailServiceError.prototype);
    }
}

export class EmailValidationError extends EmailServiceError {
    constructor(message: string, field?: string) {
        super(
            field
                ? `Validation error in field '${field}': ${message}`
                : message,
            EmailErrorCode.VALIDATION_ERROR,
            undefined,
            false
        );
        this.name = 'EmailValidationError';
    }
}

export class EmailConfigurationError extends EmailServiceError {
    constructor(message: string) {
        super(message, EmailErrorCode.CONFIGURATION_ERROR, undefined, false);
        this.name = 'EmailConfigurationError';
    }
}

// ============================================
// Configuration Management
// ============================================

class EmailConfigManager {
    private static config: EmailConfig | null = null;

    static getConfig(): EmailConfig {
        if (this.config) {
            return this.config;
        }

        const apiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.RESEND_EMAIL_FROM;

        if (!apiKey || apiKey.trim() === '') {
            throw new EmailConfigurationError(
                'RESEND_API_KEY environment variable is required but not set or empty'
            );
        }

        if (!fromEmail || fromEmail.trim() === '') {
            throw new EmailConfigurationError(
                'RESEND_EMAIL_FROM environment variable is required but not set or empty'
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(fromEmail)) {
            throw new EmailConfigurationError(
                `RESEND_EMAIL_FROM must be a valid email address. Received: ${fromEmail}`
            );
        }

        this.config = {
            apiKey: apiKey.trim(),
            fromEmail: fromEmail.trim(),
            maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
            retryDelayMs: parseInt(
                process.env.EMAIL_RETRY_DELAY_MS || '1000',
                10
            ),
            timeoutMs: parseInt(process.env.EMAIL_TIMEOUT_MS || '30000', 10),
        };

        // Validate numeric configs
        if (this.config.maxRetries < 0 || this.config.maxRetries > 10) {
            throw new EmailConfigurationError(
                'EMAIL_MAX_RETRIES must be between 0 and 10'
            );
        }

        if (
            this.config.retryDelayMs < 100 ||
            this.config.retryDelayMs > 60000
        ) {
            throw new EmailConfigurationError(
                'EMAIL_RETRY_DELAY_MS must be between 100 and 60000'
            );
        }

        if (this.config.timeoutMs < 1000 || this.config.timeoutMs > 120000) {
            throw new EmailConfigurationError(
                'EMAIL_TIMEOUT_MS must be between 1000 and 120000'
            );
        }

        return this.config;
    }

    static reset(): void {
        this.config = null;
    }
}

// ============================================
// Input Validation
// ============================================

class EmailValidator {
    private static readonly EMAIL_REGEX =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    private static readonly URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    private static readonly MAX_NAME_LENGTH = 100;
    private static readonly MAX_EMAIL_LENGTH = 254;

    static validateEmail(email: string, fieldName: string = 'email'): void {
        if (!email || typeof email !== 'string') {
            throw new EmailValidationError(
                `${fieldName} is required and must be a string`,
                fieldName
            );
        }

        const trimmed = email.trim();
        if (trimmed.length === 0) {
            throw new EmailValidationError(
                `${fieldName} cannot be empty`,
                fieldName
            );
        }

        if (trimmed.length > this.MAX_EMAIL_LENGTH) {
            throw new EmailValidationError(
                `${fieldName} exceeds maximum length of ${this.MAX_EMAIL_LENGTH} characters`,
                fieldName
            );
        }

        if (!this.EMAIL_REGEX.test(trimmed)) {
            throw new EmailValidationError(
                `${fieldName} must be a valid email address`,
                fieldName
            );
        }
    }

    static validateUrl(url: string, fieldName: string = 'url'): void {
        if (!url || typeof url !== 'string') {
            throw new EmailValidationError(
                `${fieldName} is required and must be a string`,
                fieldName
            );
        }

        const trimmed = url.trim();
        if (trimmed.length === 0) {
            throw new EmailValidationError(
                `${fieldName} cannot be empty`,
                fieldName
            );
        }

        if (!this.URL_REGEX.test(trimmed)) {
            throw new EmailValidationError(
                `${fieldName} must be a valid HTTP/HTTPS URL`,
                fieldName
            );
        }
    }

    static validateCustomerName(name: string | undefined): void {
        if (name === undefined) {
            return; // Optional field
        }

        if (typeof name !== 'string') {
            throw new EmailValidationError(
                'customerName must be a string if provided',
                'customerName'
            );
        }

        const trimmed = name.trim();
        if (trimmed.length > this.MAX_NAME_LENGTH) {
            throw new EmailValidationError(
                `customerName exceeds maximum length of ${this.MAX_NAME_LENGTH} characters`,
                'customerName'
            );
        }
    }

    static validateExpiresInHours(hours: number): void {
        if (typeof hours !== 'number' || isNaN(hours)) {
            throw new EmailValidationError(
                'expiresInHours must be a valid number',
                'expiresInHours'
            );
        }

        if (hours <= 0) {
            throw new EmailValidationError(
                'expiresInHours must be greater than 0',
                'expiresInHours'
            );
        }

        if (hours > 8760) {
            // Max 1 year
            throw new EmailValidationError(
                'expiresInHours cannot exceed 8760 (1 year)',
                'expiresInHours'
            );
        }
    }
}

// ============================================
// XSS Prevention & HTML Escaping
// ============================================

class HtmlSanitizer {
    static escapeHtml(text: string | undefined): string {
        if (!text) {
            return '';
        }

        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };

        return text.replace(/[&<>"']/g, m => map[m]);
    }

    static sanitizeUrl(url: string): string {
        // Only allow http/https URLs
        if (!/^https?:\/\//i.test(url)) {
            throw new EmailValidationError(
                'URL must start with http:// or https://'
            );
        }
        return this.escapeHtml(url);
    }
}

// ============================================
// Retry Logic with Exponential Backoff
// ============================================

class RetryManager {
    static async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number,
        baseDelayMs: number,
        operationName: string
    ): Promise<T> {
        let lastError: unknown;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // Don't retry on validation/configuration errors
                if (
                    error instanceof EmailValidationError ||
                    error instanceof EmailConfigurationError
                ) {
                    throw error;
                }

                // Check if it's a retryable error
                if (error instanceof EmailServiceError && !error.retryable) {
                    throw error;
                }

                // If this was the last attempt, throw the error
                if (attempt === maxRetries) {
                    break;
                }

                // Calculate exponential backoff delay
                const delayMs = baseDelayMs * Math.pow(2, attempt);
                const jitter = Math.random() * 0.3 * delayMs; // Add 0-30% jitter
                const totalDelay = delayMs + jitter;

                EmailService.log('warn', {
                    message: `Retrying ${operationName} after failure`,
                    attempt: attempt + 1,
                    maxRetries,
                    delayMs: Math.round(totalDelay),
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });

                await this.sleep(totalDelay);
            }
        }

        // All retries exhausted
        throw new EmailServiceError(
            `${operationName} failed after ${maxRetries + 1} attempts`,
            EmailErrorCode.API_ERROR,
            lastError,
            false
        );
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// Main Email Service
// ============================================

export interface ClaimLinkEmail {
    to: string;
    customerName?: string;
    claimLink: string;
    expiresInHours: number;
}

export class EmailService {
    private static resendClient: Resend | null = null;
    private static readonly LOG_PREFIX = '[EmailService]';

    /**
     * Initialize the Resend client (lazy initialization)
     */
    private static getResendClient(): Resend {
        if (this.resendClient) {
            return this.resendClient;
        }

        const config = EmailConfigManager.getConfig();
        this.resendClient = new Resend(config.apiKey);
        return this.resendClient;
    }

    /**
     * Structured logging utility
     */
    static log(
        level: 'info' | 'warn' | 'error',
        data: Record<string, unknown>
    ): void {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            service: 'EmailService',
            ...data,
        };

        switch (level) {
            case 'info':
                console.log(this.LOG_PREFIX, JSON.stringify(logEntry));
                break;
            case 'warn':
                console.warn(this.LOG_PREFIX, JSON.stringify(logEntry));
                break;
            case 'error':
                console.error(this.LOG_PREFIX, JSON.stringify(logEntry));
                break;
        }
    }

    /**
     * Validate all input parameters
     */
    private static validateInput(params: ClaimLinkEmail): void {
        EmailValidator.validateEmail(params.to, 'to');
        EmailValidator.validateCustomerName(params.customerName);
        EmailValidator.validateUrl(params.claimLink, 'claimLink');
        EmailValidator.validateExpiresInHours(params.expiresInHours);
    }

    /**
     * Send claim access link via email with enterprise-level error handling,
     * retry logic, and validation
     *
     * @param params - Email parameters
     * @returns Promise resolving to SendEmailResult with success status and details
     * @throws EmailServiceError for various error conditions
     */
    static async sendClaimLink(
        params: ClaimLinkEmail
    ): Promise<SendEmailResult> {
        const startTime = Date.now();

        try {
            // Validate input
            this.validateInput(params);

            const config = EmailConfigManager.getConfig();
            const { to, customerName, claimLink, expiresInHours } = params;

            // Sanitize inputs for XSS prevention
            const sanitizedCustomerName =
                HtmlSanitizer.escapeHtml(customerName);
            const sanitizedClaimLink = HtmlSanitizer.sanitizeUrl(claimLink);

            this.log('info', {
                message: 'Sending claim link email',
                to: to.substring(0, 3) + '***', // Partial email for privacy
                hasCustomerName: !!customerName,
                expiresInHours,
            });

            // Execute with retry logic
            const result = await RetryManager.executeWithRetry(
                async () => {
                    const client = this.getResendClient();
                    const response = await client.emails.send({
                        from: config.fromEmail,
                        to,
                        subject: 'Your Secure Claim Access Link',
                        html: this.getEmailTemplate(
                            sanitizedCustomerName,
                            sanitizedClaimLink,
                            expiresInHours
                        ),
                    });

                    // Handle Resend API response
                    if (response.error) {
                        const errorMessage =
                            response.error.message ||
                            'Unknown Resend API error';
                        const statusCode = response.error.statusCode;
                        const isRetryable = Boolean(
                            statusCode &&
                                (statusCode >= 500 || statusCode === 429)
                        );

                        throw new EmailServiceError(
                            `Resend API error: ${errorMessage}`,
                            statusCode === 429
                                ? EmailErrorCode.RATE_LIMIT_ERROR
                                : EmailErrorCode.API_ERROR,
                            response.error,
                            isRetryable
                        );
                    }

                    return response.data;
                },
                config.maxRetries,
                config.retryDelayMs,
                'sendClaimLink'
            );

            const duration = Date.now() - startTime;

            this.log('info', {
                message: 'Email sent successfully',
                to: to.substring(0, 3) + '***',
                messageId: result?.id,
                durationMs: duration,
            });

            return {
                success: true,
                messageId: result?.id,
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            if (
                error instanceof EmailValidationError ||
                error instanceof EmailConfigurationError
            ) {
                this.log('error', {
                    message:
                        'Email send failed - validation/configuration error',
                    error: error.message,
                    code: error.code,
                    durationMs: duration,
                });
                throw error;
            }

            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorCode =
                error instanceof EmailServiceError
                    ? error.code
                    : EmailErrorCode.UNKNOWN_ERROR;

            this.log('error', {
                message: 'Email send failed',
                error: errorMessage,
                code: errorCode,
                durationMs: duration,
                retryable:
                    error instanceof EmailServiceError
                        ? error.retryable
                        : false,
            });

            return {
                success: false,
                error: errorMessage,
                errorCode,
            };
        }
    }

    /**
     * Generate HTML email template with XSS protection
     */
    private static getEmailTemplate(
        customerName: string,
        claimLink: string,
        expiresInHours: number
    ): string {
        // Ensure expiresInHours is a safe number
        const safeHours = Math.max(
            1,
            Math.min(8760, Math.floor(expiresInHours))
        );

        return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #ffffff;
              }
              .header { 
                background: #4F46E5; 
                color: white; 
                padding: 20px; 
                text-align: center; 
                border-radius: 8px 8px 0 0;
              }
              .content { 
                padding: 30px; 
                background: #f9fafb; 
              }
              .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: #4F46E5; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0;
                font-weight: 600;
              }
              .button:hover {
                background: #4338CA;
              }
              .warning { 
                background: #FEF3C7; 
                border-left: 4px solid #F59E0B; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 4px;
              }
              .footer { 
                padding: 20px; 
                text-align: center; 
                color: #6B7280; 
                font-size: 12px; 
                background: #ffffff;
                border-radius: 0 0 8px 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">SecureClaim Access Link</h1>
              </div>
              <div class="content">
                <p>Hello${customerName ? ` ${customerName}` : ''},</p>
                <p>You can now submit your insurance claim using the secure link below:</p>
                <div style="text-align: center;">
                  <a href="${claimLink}" class="button">Access Your Claim Form</a>
                </div>
                <div class="warning">
                  <strong>⚠️ Important Security Information:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link expires in <strong>${safeHours} hour${
                        safeHours !== 1 ? 's' : ''
                    }</strong></li>
                    <li>Can only be used <strong>once</strong></li>
                    <li>Do not share this link with anyone</li>
                    <li>Our team will never ask for this link</li>
                  </ul>
                </div>
                <p>If you did not request this link or need assistance, please contact our support team immediately.</p>
              </div>
              <div class="footer">
                <p style="margin: 0;">© ${new Date().getFullYear()} Crashify. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    /**
     * Reset configuration (useful for testing)
     */
    static reset(): void {
        EmailConfigManager.reset();
        this.resendClient = null;
    }
}
