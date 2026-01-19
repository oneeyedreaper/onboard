// Load .env BEFORE importing PrismaClient
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create onboarding steps
    const steps = [
        {
            stepNumber: 1,
            name: 'personal_info',
            title: 'Personal Information',
            description: 'Tell us about yourself and your company',
            isRequired: true,
        },
        {
            stepNumber: 2,
            name: 'documents',
            title: 'Document Upload',
            description: 'Upload required verification documents',
            isRequired: true,
        },
        {
            stepNumber: 3,
            name: 'verification',
            title: 'Verification',
            description: 'Wait for document verification',
            isRequired: true,
        },
        {
            stepNumber: 4,
            name: 'setup',
            title: 'Final Setup',
            description: 'Configure your preferences and complete onboarding',
            isRequired: true,
        },
    ];

    for (const step of steps) {
        await prisma.onboardingStep.upsert({
            where: { stepNumber: step.stepNumber },
            update: step,
            create: step,
        });
    }

    console.log('✅ Seeded onboarding steps');
    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
