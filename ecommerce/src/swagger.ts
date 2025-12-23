import * as swaggerJsdocModule from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerJsdoc = (swaggerJsdocModule as any).default || swaggerJsdocModule;

const options: any = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Keka Clone HRMS API Documentation',
            version: '1.0.0',
            description: 'Complete API documentation for HRMS Backend with authentication and authorization system',
            contact: {
                name: 'API Support',
                email: 'support@signity.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>'
                }
            },
            schemas: {
                // User Schema
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@signity.com' },
                        role: { type: 'string', enum: ['ADMIN', 'HR', 'EMPLOYEE'], example: 'ADMIN' },
                        companyId: { type: 'string', example: 'signity-company-id' },
                        isEmailVerified: { type: 'boolean', example: true },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        company: { $ref: '#/components/schemas/Company' }
                    }
                },
                // Company Schema
                Company: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'signity-company-id' },
                        name: { type: 'string', example: 'Signity Solutions' },
                        slug: { type: 'string', example: 'signity' },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                // OTP Schema
                OTP: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        email: { type: 'string', format: 'email', example: 'admin@signity.com' },
                        otpCode: { type: 'string', example: '123456' },
                        purpose: { type: 'string', enum: ['REGISTRATION', 'LOGIN', 'EMAIL_VERIFICATION'], example: 'REGISTRATION' },
                        isVerified: { type: 'boolean', example: false },
                        attempts: { type: 'integer', example: 0 },
                        createdAt: { type: 'string', format: 'date-time' },
                        expiresAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Error Schema
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Error message' },
                        errorCode: { type: 'integer', example: 1001 },
                        errors: { type: 'object', nullable: true }
                    }
                },
                // Department Schema
                Department: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        name: { type: 'string', example: 'Engineering' },
                        description: { type: 'string', example: 'Software development team', nullable: true },
                        companyId: { type: 'string', example: 'signity-company-id' },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        userCount: { type: 'integer', example: 5 }
                    }
                },
                // Invitation Schema
                Invitation: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        email: { type: 'string', format: 'email', example: 'newuser@signity.com' },
                        name: { type: 'string', example: 'New User' },
                        role: { type: 'string', enum: ['ADMIN', 'HR', 'EMPLOYEE'], example: 'EMPLOYEE' },
                        companyId: { type: 'string', example: 'signity-company-id' },
                        departmentId: { type: 'string', example: 'department-uuid', nullable: true },
                        invitedBy: { type: 'string', example: 'admin-user-id' },
                        status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'], example: 'PENDING' },
                        token: { type: 'string', example: 'invitation-token-string' },
                        expiresAt: { type: 'string', format: 'date-time' },
                        acceptedAt: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Dashboard Stats Schema
                DashboardStats: {
                    type: 'object',
                    properties: {
                        totalUsers: { type: 'integer', example: 25 },
                        activeUsers: { type: 'integer', example: 23 },
                        totalDepartments: { type: 'integer', example: 5 },
                        pendingInvitations: { type: 'integer', example: 3 },
                        userGrowth: { type: 'number', format: 'float', example: 15.5 },
                        departmentGrowth: { type: 'number', format: 'float', example: 25.0 }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints (login, profile)'
            },
            {
                name: 'Admin Authentication',
                description: 'Admin registration and authentication endpoints'
            },
            {
                name: 'User Management',
                description: 'User CRUD operations with role-based access control'
            },
            {
                name: 'Department Management',
                description: 'Department CRUD operations for HR and Admin users'
            },
            {
                name: 'Invitation Management',
                description: 'Member invitation system with email notifications'
            },
            {
                name: 'Dashboard',
                description: 'Dashboard statistics and company overview endpoints'
            },
            {
                name: 'Testing',
                description: 'Test endpoints for role-based access control and system functionality'
            }
        ]
    },
    apis: ['./src/routes/*.ts'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Keka Clone HRMS API Docs'
    }));

    // JSON endpoint
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('Swagger documentation available at http://localhost:3000/api-docs');
};
