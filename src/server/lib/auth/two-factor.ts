import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export function generateTwoFactorSecret(email: string) {
    const secret = speakeasy.generateSecret({
        name: `CarInsure Admin (${email})`,
        issuer: 'CarInsure',
    });

    return secret;
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
}

export function verifyTwoFactorToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before/after for clock skew
    });
}
