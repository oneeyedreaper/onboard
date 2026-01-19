import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
    // Server
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // JWT
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
} as const;

// Validate required environment variables
export function validateEnv(): void {
    const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0 && config.env === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
