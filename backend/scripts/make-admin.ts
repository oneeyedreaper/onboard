import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env before prisma
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function makeAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Please provide an email address');
        console.log('Usage: npx tsx scripts/make-admin.ts <email>');
        process.exit(1);
    }

    try {
        const client = await prisma.client.findUnique({
            where: { email },
        });

        if (!client) {
            console.error(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        if (client.role === 'ADMIN') {
            console.log(`ℹ️  User "${email}" is already an admin`);
            process.exit(0);
        }

        await prisma.client.update({
            where: { email },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ Successfully made "${email}" an admin`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
