import { hashPassword, comparePassword } from '../src/utils/hash';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} from '../src/utils/jwt';
import { signupSchema, loginSchema, updateProfileSchema } from '../src/validators/schemas';

describe('Password Hashing Utilities', () => {
    const testPassword = 'SecurePass123';

    test('should hash a password', async () => {
        const hash = await hashPassword(testPassword);
        expect(hash).toBeDefined();
        expect(hash).not.toBe(testPassword);
        expect(hash.length).toBeGreaterThan(0);
    });

    test('should verify correct password', async () => {
        const hash = await hashPassword(testPassword);
        const isValid = await comparePassword(testPassword, hash);
        expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
        const hash = await hashPassword(testPassword);
        const isValid = await comparePassword('wrongpassword', hash);
        expect(isValid).toBe(false);
    });
});

describe('JWT Utilities', () => {
    const testPayload = {
        clientId: 'test-client-id',
        email: 'test@example.com',
    };

    test('should generate access token', () => {
        const token = generateAccessToken(testPayload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });

    test('should generate refresh token', () => {
        const token = generateRefreshToken(testPayload);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });

    test('should verify access token', () => {
        const token = generateAccessToken(testPayload);
        const decoded = verifyAccessToken(token);
        expect(decoded.clientId).toBe(testPayload.clientId);
        expect(decoded.email).toBe(testPayload.email);
        expect(decoded.type).toBe('access');
    });

    test('should verify refresh token', () => {
        const token = generateRefreshToken(testPayload);
        const decoded = verifyRefreshToken(token);
        expect(decoded.clientId).toBe(testPayload.clientId);
        expect(decoded.email).toBe(testPayload.email);
        expect(decoded.type).toBe('refresh');
    });

    test('should throw on invalid token', () => {
        expect(() => verifyAccessToken('invalid-token')).toThrow();
    });
});

describe('Validation Schemas', () => {
    describe('signupSchema', () => {
        test('should validate correct signup data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'SecurePass123',
                firstName: 'John',
                lastName: 'Doe',
            };
            const result = signupSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        test('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'SecurePass123',
                firstName: 'John',
                lastName: 'Doe',
            };
            const result = signupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        test('should reject weak password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'weak',
                firstName: 'John',
                lastName: 'Doe',
            };
            const result = signupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        test('should reject password without uppercase', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'securepass123',
                firstName: 'John',
                lastName: 'Doe',
            };
            const result = signupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        test('should validate correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'anypassword',
            };
            const result = loginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        test('should reject missing password', () => {
            const invalidData = {
                email: 'test@example.com',
            };
            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('updateProfileSchema', () => {
        test('should validate partial update', () => {
            const validData = {
                firstName: 'Jane',
            };
            const result = updateProfileSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        test('should validate full update', () => {
            const validData = {
                firstName: 'Jane',
                lastName: 'Doe',
                companyName: 'Acme Corp',
                phone: '+1-555-1234',
            };
            const result = updateProfileSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        test('should reject invalid phone format', () => {
            const invalidData = {
                phone: 'not-a-phone',
            };
            const result = updateProfileSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
