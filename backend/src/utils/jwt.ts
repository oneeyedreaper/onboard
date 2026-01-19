import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
    clientId: string;
    email: string;
    type: 'access' | 'refresh';
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
        { ...payload, type: 'access' },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiresIn } as SignOptions
    );
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
        { ...payload, type: 'refresh' },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

/**
 * Calculate expiration date from JWT expiresIn string
 */
export function getRefreshTokenExpiry(): Date {
    const expiresIn = config.jwt.refreshExpiresIn;
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
}
