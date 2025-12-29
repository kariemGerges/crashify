// =============================================
// FILE: server/lib/utils/logger.ts
// Enterprise-level logging utility with sensitive data sanitization
// =============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service?: string;
    message: string;
    data?: Record<string, unknown>;
    requestId?: string;
    userId?: string;
    [key: string]: unknown;
}

/**
 * Sensitive data patterns to sanitize
 */
const SENSITIVE_PATTERNS = [
    // Environment variables
    /(password|secret|token|key|api[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key)/gi,
    // Common sensitive fields
    /(password|pwd|passwd|secret|token|key|credential|auth)/gi,
    // Email addresses (can be PII)
    /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi,
    // Phone numbers
    /(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g,
    // Credit card numbers
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // API keys (long alphanumeric strings)
    /\b[A-Za-z0-9]{32,}\b/g,
];

/**
 * Sanitize sensitive data from log entries
 */
function sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string') {
        let sanitized = value;

        // Check if the key name suggests sensitive data
        for (const pattern of SENSITIVE_PATTERNS) {
            sanitized = sanitized.replace(pattern, (match, ...args) => {
                // Don't redact if it's part of a key name (we'll handle keys separately)
                if (args[args.length - 1] === 0) {
                    return match;
                }
                // Redact the value
                if (match.length <= 4) {
                    return '***';
                }
                return (
                    match.substring(0, 2) +
                    '***' +
                    match.substring(match.length - 2)
                );
            });
        }

        return sanitized;
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map(item => sanitizeValue(item));
        }

        const sanitized: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            const lowerKey = key.toLowerCase();

            // Check if key name suggests sensitive data
            if (
                lowerKey.includes('password') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('token') ||
                lowerKey.includes('key') ||
                lowerKey.includes('credential') ||
                lowerKey.includes('auth') ||
                lowerKey.includes('api_key') ||
                lowerKey.includes('client_secret') ||
                lowerKey.includes('access_token') ||
                lowerKey.includes('refresh_token')
            ) {
                // Redact sensitive values
                if (typeof val === 'string') {
                    if (val.length <= 4) {
                        sanitized[key] = '***';
                    } else {
                        sanitized[key] =
                            val.substring(0, 2) +
                            '***' +
                            val.substring(val.length - 2);
                    }
                } else {
                    sanitized[key] = '[REDACTED]';
                }
            } else if (lowerKey.includes('email') && typeof val === 'string') {
                // Partially mask email addresses
                const emailMatch = val.match(/^([^@]+)@(.+)$/);
                if (emailMatch) {
                    const [local, domain] = emailMatch.slice(1);
                    sanitized[key] = local.substring(0, 2) + '***@' + domain;
                } else {
                    sanitized[key] = val;
                }
            } else if (lowerKey.includes('phone') && typeof val === 'string') {
                // Mask phone numbers
                sanitized[key] =
                    val.replace(/\d/g, '*').substring(0, 4) + '***';
            } else {
                // Recursively sanitize nested objects
                sanitized[key] = sanitizeValue(val);
            }
        }
        return sanitized;
    }

    return value;
}

/**
 * Create a sanitized log entry
 */
function createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    options?: {
        service?: string;
        requestId?: string;
        userId?: string;
    }
): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };

    if (options?.service) {
        entry.service = options.service;
    }

    if (options?.requestId) {
        entry.requestId = options.requestId;
    }

    if (options?.userId) {
        entry.userId = options.userId;
    }

    if (data) {
        entry.data = sanitizeValue(data) as Record<string, unknown>;
    }

    return entry;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
}

/**
 * Enterprise Logger Class
 */
export class Logger {
    private service: string;

    constructor(service: string) {
        this.service = service;
    }

    /**
     * Log debug message (only in development)
     */
    debug(
        message: string,
        data?: Record<string, unknown>,
        options?: { requestId?: string; userId?: string }
    ): void {
        if (process.env.NODE_ENV === 'development') {
            const entry = createLogEntry('debug', message, data, {
                service: this.service,
                ...options,
            });
            console.debug(`[${this.service}]`, formatLogEntry(entry));
        }
    }

    /**
     * Log info message
     */
    info(
        message: string,
        data?: Record<string, unknown>,
        options?: { requestId?: string; userId?: string }
    ): void {
        const entry = createLogEntry('info', message, data, {
            service: this.service,
            ...options,
        });
        console.log(`[${this.service}]`, formatLogEntry(entry));
    }

    /**
     * Log warning message
     */
    warn(
        message: string,
        data?: Record<string, unknown>,
        options?: { requestId?: string; userId?: string }
    ): void {
        const entry = createLogEntry('warn', message, data, {
            service: this.service,
            ...options,
        });
        console.warn(`[${this.service}]`, formatLogEntry(entry));
    }

    /**
     * Log error message
     */
    error(
        message: string,
        error?: unknown,
        data?: Record<string, unknown>,
        options?: { requestId?: string; userId?: string }
    ): void {
        const errorData: Record<string, unknown> = {
            ...data,
        };

        if (error instanceof Error) {
            errorData.errorName = error.name;
            errorData.errorMessage = error.message;
            // Only include stack trace in development
            if (process.env.NODE_ENV === 'development') {
                errorData.errorStack = error.stack?.substring(0, 500); // Limit stack trace length
            }
        } else if (error !== undefined) {
            errorData.error = String(error);
        }

        const entry = createLogEntry('error', message, errorData, {
            service: this.service,
            ...options,
        });
        console.error(`[${this.service}]`, formatLogEntry(entry));
    }
}

/**
 * Create a logger instance for a service
 */
export function createLogger(service: string): Logger {
    return new Logger(service);
}

/**
 * Default logger for general use
 */
export const logger = createLogger('App');
