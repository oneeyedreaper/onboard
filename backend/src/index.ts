import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { config, validateEnv } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import prisma from './lib/prisma.js';

// Validate environment variables
validateEnv();

// Create Express app
const app = express();

// Trust proxy for reverse proxy environments (Render, Heroku, etc.)
// This is required for rate limiting to work correctly
if (config.env === 'production') {
    app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests, please try again later.',
        },
    },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.env !== 'production') {
    app.use(morgan('dev'));
}

// Swagger documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Client Onboarding API',
            version: '1.0.0',
            description: 'API for client registration, authentication, and multi-step onboarding workflow',
            contact: {
                name: 'API Support',
            },
        },
        servers: config.env === 'production'
            ? [
                {
                    url: process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`,
                    description: 'Production server',
                },
            ]
            : [
                {
                    url: `http://localhost:${config.port}`,
                    description: 'Development server',
                },
            ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Profile', description: 'Profile management' },
            { name: 'Onboarding', description: 'Onboarding workflow' },
            { name: 'Documents', description: 'Document management' },
            { name: 'Admin', description: 'Admin dashboard and management' },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Client Onboarding API',
        version: '1.0.0',
        docs: '/api-docs',
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
    console.log(`
  🚀 Server running in ${config.env} mode
  📍 Local:    http://localhost:${config.port}
  📚 API Docs: http://localhost:${config.port}/api-docs
  `);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    server.close(async () => {
        console.log('✅ HTTP server closed');
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Forcing shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
