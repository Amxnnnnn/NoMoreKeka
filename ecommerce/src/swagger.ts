import swaggerJsdoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: any = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Signity HRMS API Documentation',
            version: '2.1.0',
            description: `
# Signity HRMS API - Complete Testing Documentation

## 🚀 Overview
A comprehensive Human Resource Management System API with role-based access control, project management, time tracking, and analytics. This API provides complete functionality for managing employees, projects, tasks, leaves, and organizational structure.

## 🔐 Authentication & Authorization
- **Authentication Type**: Bearer Token (JWT)
- **Header Format**: \`Authorization: Bearer <your-jwt-token>\`
- **Token Expiration**: 24 hours (configurable)

### Role-Based Access Control
- **ADMIN**: Full system access, user management, system configuration
- **HR**: Employee management, leave approvals, department management
- **MANAGER**: Team management, project oversight, task assignment
- **EMPLOYEE**: Personal profile, task updates, leave applications

## 🎯 Quick Start Guide

### Step 1: Admin Account Setup
1. **Request OTP**: \`POST /api/auth/admin/request-signup-otp\`
2. **Verify & Create Admin**: \`POST /api/auth/admin/verify-signup-otp\`

### Step 2: Authentication
1. **Login**: \`POST /api/auth/login\`
2. **Copy JWT Token** from response
3. **Set Authorization** in Swagger UI (click "Authorize" button)
4. **Format**: \`Bearer <your-token-here>\`

### Step 3: Start Testing
- All endpoints require authentication except auth endpoints
- Use the "Try it out" feature in each endpoint
- Check response schemas and status codes

## 📊 API Statistics
- **Total Endpoints**: 150+
- **Authentication Endpoints**: 8
- **User Management**: 15+
- **Project Management**: 25+
- **Team Management**: 12+
- **Leave Management**: 18+
- **Analytics**: 20+

## 🔧 Testing Features
- **Interactive Testing**: Try all endpoints directly in browser
- **Request/Response Examples**: Complete examples for all endpoints
- **Schema Validation**: Detailed request/response schemas
- **Error Handling**: Comprehensive error response documentation
- **Role-Based Testing**: Test different user roles and permissions

## 📝 Important Notes
- Server runs on **http://localhost:3001**
- All timestamps are in ISO 8601 format
- Pagination available on list endpoints
- File uploads supported for profile pictures
- Real-time notifications via WebSocket
- Comprehensive audit logging

## 🆘 Support
- **Email**: support@signity.com
- **Documentation**: Complete API guides available
- **Testing Guide**: SWAGGER_API_TESTING_GUIDE.md
            `,
            contact: {
                name: 'Signity Solutions API Support',
                email: 'support@signity.com',
                url: 'https://signity.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server'
            },
            {
                url: 'https://api.signity.com',
                description: 'Production server'
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
            responses: {
                BadRequest: {
                    description: 'Bad Request - Invalid input data',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                Unauthorized: {
                    description: 'Unauthorized - Authentication required',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                Forbidden: {
                    description: 'Forbidden - Insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                NotFound: {
                    description: 'Not Found - Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                InternalError: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                Success: {
                    description: 'Operation successful',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SuccessResponse' }
                        }
                    }
                }
            },
            schemas: {
                // Base Response Schemas
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation completed successfully' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' },
                        errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                PaginationInfo: {
                    type: 'object',
                    properties: {
                        currentPage: { type: 'integer', example: 1 },
                        totalPages: { type: 'integer', example: 5 },
                        totalItems: { type: 'integer', example: 48 },
                        itemsPerPage: { type: 'integer', example: 10 },
                        hasNextPage: { type: 'boolean', example: true },
                        hasPreviousPage: { type: 'boolean', example: false }
                    }
                },

                // Authentication Schemas
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@signity.com' },
                        password: { type: 'string', minLength: 8, example: 'AdminPassword123' }
                    }
                },
                LoginResponse: {
                    allOf: [
                        { $ref: '#/components/schemas/SuccessResponse' },
                        {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                            }
                        }
                    ]
                },
                OTPRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@signity.com' }
                    }
                },
                OTPVerifyRequest: {
                    type: 'object',
                    required: ['email', 'otpCode'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@signity.com' },
                        otpCode: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' }
                    }
                },
                AdminSignupRequest: {
                    type: 'object',
                    required: ['email', 'otpCode', 'name', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@signity.com' },
                        otpCode: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' },
                        name: { type: 'string', minLength: 2, example: 'Admin User' },
                        password: { type: 'string', minLength: 8, example: 'AdminPassword123' }
                    }
                },

                // User Management Schemas
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@signity.com' },
                        role: { 
                            type: 'string', 
                            enum: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], 
                            example: 'EMPLOYEE' 
                        },
                        companyId: { type: 'string', example: 'signity-company-id' },
                        departmentId: { type: 'string', example: 'department-uuid', nullable: true },
                        teamId: { type: 'string', example: 'team-uuid', nullable: true },
                        isEmailVerified: { type: 'boolean', example: true },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                UserBasic: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@signity.com' },
                        role: { 
                            type: 'string', 
                            enum: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], 
                            example: 'EMPLOYEE' 
                        }
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

                // Department Schemas
                Department: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid-string' },
                        name: { type: 'string', example: 'Engineering' },
                        description: { type: 'string', example: 'Software development team', nullable: true },
                        companyId: { type: 'string', example: 'signity-company-id' },
                        isActive: { type: 'boolean', example: true },
                        userCount: { type: 'integer', example: 5 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },

                // Team Management Schemas
                TeamBasic: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'team-uuid' },
                        name: { type: 'string', example: 'Frontend Development Team' },
                        description: { type: 'string', example: 'React and TypeScript development specialists' }
                    }
                },
                Team: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'team-uuid' },
                        name: { type: 'string', example: 'Frontend Development Team' },
                        description: { type: 'string', example: 'React and TypeScript development specialists' },
                        managerId: { type: 'string', example: 'manager-uuid' },
                        departmentId: { type: 'string', example: 'department-uuid' },
                        companyId: { type: 'string', example: 'company-uuid' },
                        isActive: { type: 'boolean', example: true },
                        memberCount: { type: 'integer', example: 5 },
                        projectCount: { type: 'integer', example: 3 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                TeamWithDetails: {
                    allOf: [
                        { $ref: '#/components/schemas/Team' },
                        {
                            type: 'object',
                            properties: {
                                manager: { $ref: '#/components/schemas/UserBasic' },
                                members: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/UserBasic' }
                                },
                                projects: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/ProjectBasic' }
                                }
                            }
                        }
                    ]
                },
                TeamWithMembers: {
                    allOf: [
                        { $ref: '#/components/schemas/Team' },
                        {
                            type: 'object',
                            properties: {
                                manager: { $ref: '#/components/schemas/UserBasic' },
                                members: {
                                    type: 'array',
                                    items: {
                                        allOf: [
                                            { $ref: '#/components/schemas/UserBasic' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    department: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string', example: 'Engineering' }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                },
                TeamStructure: {
                    allOf: [
                        { $ref: '#/components/schemas/TeamWithDetails' },
                        {
                            type: 'object',
                            properties: {
                                statistics: {
                                    type: 'object',
                                    properties: {
                                        memberCount: { type: 'integer', example: 5 },
                                        projectCount: { type: 'integer', example: 3 },
                                        totalActiveTasks: { type: 'integer', example: 15 },
                                        overdueTasks: { type: 'integer', example: 2 }
                                    }
                                },
                                members: {
                                    type: 'array',
                                    items: {
                                        allOf: [
                                            { $ref: '#/components/schemas/UserBasic' },
                                            {
                                                type: 'object',
                                                properties: {
                                                    department: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string', example: 'Engineering' }
                                                        }
                                                    },
                                                    assignedTasks: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                id: { type: 'string', example: 'task-uuid' },
                                                                title: { type: 'string', example: 'Implement user authentication' },
                                                                status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'], example: 'IN_PROGRESS' },
                                                                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
                                                                dueDate: { type: 'string', format: 'date-time', nullable: true }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                },
                CreateTeamRequest: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { 
                            type: 'string', 
                            minLength: 2,
                            maxLength: 100,
                            example: 'Frontend Development Team',
                            description: 'Team name (must be unique within company)'
                        },
                        description: { 
                            type: 'string', 
                            maxLength: 500,
                            example: 'Specialized team for React and TypeScript development',
                            description: 'Optional team description'
                        }
                    }
                },
                UpdateTeamRequest: {
                    type: 'object',
                    properties: {
                        name: { 
                            type: 'string', 
                            minLength: 2,
                            maxLength: 100,
                            example: 'Frontend Development Team',
                            description: 'Updated team name (must be unique within company)'
                        },
                        description: { 
                            type: 'string', 
                            maxLength: 500,
                            example: 'Updated team description',
                            description: 'Updated team description'
                        }
                    }
                },
                AddTeamMembersRequest: {
                    type: 'object',
                    required: ['memberIds'],
                    properties: {
                        memberIds: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                            maxItems: 50,
                            example: ['user-uuid-1', 'user-uuid-2', 'user-uuid-3'],
                            description: 'Array of user IDs to add to the team. Users must exist and be active in the same company.'
                        }
                    }
                },
                ReassignTeamMemberRequest: {
                    type: 'object',
                    required: ['newTeamId'],
                    properties: {
                        newTeamId: {
                            type: 'string',
                            example: 'new-team-uuid',
                            description: 'ID of the team to reassign the member to. Team must exist and be active.'
                        }
                    }
                },
                WorkloadSummary: {
                    type: 'object',
                    properties: {
                        totalTasks: { type: 'integer', example: 25, description: 'Total active tasks across all team members' },
                        totalUrgentTasks: { type: 'integer', example: 5, description: 'Number of urgent priority tasks' },
                        totalOverdueTasks: { type: 'integer', example: 3, description: 'Number of overdue tasks' },
                        totalEstimatedHours: { type: 'number', format: 'float', example: 120.5, description: 'Total estimated hours for all active tasks' }
                    }
                },
                MemberWorkload: {
                    type: 'object',
                    properties: {
                        member: { $ref: '#/components/schemas/UserBasic' },
                        workload: {
                            type: 'object',
                            properties: {
                                totalTasks: { type: 'integer', example: 8, description: 'Total active tasks assigned to member' },
                                urgentTasks: { type: 'integer', example: 2, description: 'Number of urgent tasks' },
                                overdueTasks: { type: 'integer', example: 1, description: 'Number of overdue tasks' },
                                estimatedHours: { type: 'number', format: 'float', example: 32.5, description: 'Total estimated hours' },
                                workloadLevel: { 
                                    type: 'string', 
                                    enum: ['LOW', 'MEDIUM', 'HIGH'], 
                                    example: 'MEDIUM',
                                    description: 'Calculated workload level based on task count'
                                }
                            }
                        },
                        tasks: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', example: 'task-uuid' },
                                    title: { type: 'string', example: 'Implement user authentication' },
                                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'], example: 'IN_PROGRESS' },
                                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
                                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                                    estimatedHours: { type: 'number', format: 'float', example: 8.0, nullable: true }
                                }
                            }
                        }
                    }
                },
                TeamPerformanceMetrics: {
                    type: 'object',
                    properties: {
                        teamId: { type: 'string', example: 'team-uuid' },
                        teamName: { type: 'string', example: 'Frontend Development Team' },
                        performanceScore: { 
                            type: 'number', 
                            format: 'float', 
                            example: 85.5,
                            description: 'Overall team performance score (0-100)'
                        },
                        metrics: {
                            type: 'object',
                            properties: {
                                projectCompletionRate: { 
                                    type: 'number', 
                                    format: 'float', 
                                    example: 75.0,
                                    description: 'Percentage of completed projects'
                                },
                                taskCompletionRate: { 
                                    type: 'number', 
                                    format: 'float', 
                                    example: 88.5,
                                    description: 'Percentage of completed tasks'
                                },
                                deadlineAdherence: { 
                                    type: 'number', 
                                    format: 'float', 
                                    example: 92.0,
                                    description: 'Percentage of tasks completed on time'
                                }
                            }
                        },
                        memberPerformances: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    memberId: { type: 'string', example: 'user-uuid' },
                                    memberName: { type: 'string', example: 'John Doe' },
                                    memberEmail: { type: 'string', example: 'john@signity.com' },
                                    metrics: {
                                        type: 'object',
                                        properties: {
                                            taskCompletionRate: { type: 'number', format: 'float', example: 85.5 },
                                            onTimeDelivery: { type: 'number', format: 'float', example: 90.0 },
                                            workLogApprovalRate: { type: 'number', format: 'float', example: 95.0 },
                                            loadFactorNormalization: { type: 'number', format: 'float', example: 88.0 },
                                            individualPerformance: { type: 'number', format: 'float', example: 87.5 }
                                        }
                                    }
                                }
                            }
                        },
                        calculatedAt: { type: 'string', format: 'date-time' }
                    }
                },

                // Project Schemas
                ProjectBasic: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'project-uuid' },
                        name: { type: 'string', example: 'E-commerce Platform' },
                        status: { 
                            type: 'string', 
                            enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], 
                            example: 'IN_PROGRESS' 
                        },
                        priority: { 
                            type: 'string', 
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
                            example: 'HIGH' 
                        }
                    }
                },
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'project-uuid' },
                        name: { type: 'string', example: 'E-commerce Platform Development' },
                        description: { type: 'string', example: 'Building a modern e-commerce platform with React and Node.js' },
                        status: { 
                            type: 'string', 
                            enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], 
                            example: 'IN_PROGRESS' 
                        },
                        priority: { 
                            type: 'string', 
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
                            example: 'HIGH' 
                        },
                        progress: { type: 'integer', minimum: 0, maximum: 100, example: 65 },
                        teamId: { type: 'string', example: 'team-uuid' },
                        managerId: { type: 'string', example: 'manager-uuid' },
                        companyId: { type: 'string', example: 'company-uuid' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time', nullable: true },
                        deadline: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },

                // Task Schemas
                Task: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'task-uuid' },
                        title: { type: 'string', example: 'Implement user authentication' },
                        description: { type: 'string', example: 'Create login/register functionality with JWT tokens' },
                        status: { 
                            type: 'string', 
                            enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'], 
                            example: 'IN_PROGRESS' 
                        },
                        priority: { 
                            type: 'string', 
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
                            example: 'HIGH' 
                        },
                        projectId: { type: 'string', example: 'project-uuid' },
                        assigneeId: { type: 'string', example: 'user-uuid', nullable: true },
                        createdById: { type: 'string', example: 'manager-uuid' },
                        estimatedHours: { type: 'number', format: 'float', example: 8.5, nullable: true },
                        actualHours: { type: 'number', format: 'float', example: 10.0, nullable: true },
                        dueDate: { type: 'string', format: 'date-time', nullable: true },
                        completedAt: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },

                // Work Log Schemas
                WorkLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'worklog-uuid' },
                        userId: { type: 'string', example: 'user-uuid' },
                        projectId: { type: 'string', example: 'project-uuid' },
                        taskId: { type: 'string', example: 'task-uuid', nullable: true },
                        date: { type: 'string', format: 'date', example: '2024-01-15' },
                        hoursWorked: { type: 'number', format: 'float', example: 8.5 },
                        description: { type: 'string', example: 'Worked on user authentication feature' },
                        logType: { 
                            type: 'string', 
                            enum: ['DAILY', 'OVERTIME', 'BREAK'], 
                            example: 'DAILY' 
                        },
                        isApproved: { type: 'boolean', example: false },
                        approvedBy: { type: 'string', example: 'manager-uuid', nullable: true },
                        approvedAt: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },

                // Leave Management Schemas
                LeaveType: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'leave-type-uuid' },
                        name: { type: 'string', example: 'Annual Leave' },
                        description: { type: 'string', example: 'Yearly vacation leave' },
                        defaultDays: { type: 'integer', example: 25 },
                        isActive: { type: 'boolean', example: true }
                    }
                },
                Leave: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'leave-uuid' },
                        userId: { type: 'string', example: 'user-uuid' },
                        leaveTypeId: { type: 'string', example: 'leave-type-uuid' },
                        startDate: { type: 'string', format: 'date', example: '2024-01-15' },
                        endDate: { type: 'string', format: 'date', example: '2024-01-17' },
                        days: { type: 'integer', example: 3 },
                        reason: { type: 'string', example: 'Personal vacation' },
                        status: { 
                            type: 'string', 
                            enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], 
                            example: 'PENDING' 
                        },
                        approvedBy: { type: 'string', example: 'manager-uuid', nullable: true },
                        approvedAt: { type: 'string', format: 'date-time', nullable: true },
                        comments: { type: 'string', example: 'Approved for vacation', nullable: true },
                        appliedAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },

                // Notification Schemas
                Notification: {
                    type: 'object',
                    properties: {
                        id: { 
                            type: 'string', 
                            example: 'notification-uuid-123',
                            description: 'Unique notification identifier'
                        },
                        userId: { 
                            type: 'string', 
                            example: 'user-uuid-123',
                            description: 'ID of the user who receives this notification'
                        },
                        title: { 
                            type: 'string', 
                            example: 'Leave Request Approved',
                            description: 'Notification title/subject'
                        },
                        message: { 
                            type: 'string', 
                            example: 'Your leave request for Jan 15-17 has been approved by your manager',
                            description: 'Detailed notification message'
                        },
                        type: { 
                            type: 'string', 
                            enum: ['LEAVE_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'TASK_ASSIGNED', 'TASK_OVERDUE', 'PROJECT_DEADLINE', 'TEAM_UPDATE', 'SYSTEM_ALERT'], 
                            example: 'LEAVE_APPROVED',
                            description: 'Type/category of the notification'
                        },
                        isRead: { 
                            type: 'boolean', 
                            example: false,
                            description: 'Whether the notification has been read by the user'
                        },
                        readAt: { 
                            type: 'string', 
                            format: 'date-time', 
                            nullable: true,
                            example: null,
                            description: 'Timestamp when the notification was marked as read'
                        },
                        relatedId: { 
                            type: 'string', 
                            example: 'leave-request-uuid-123', 
                            nullable: true,
                            description: 'ID of the related entity (leave, task, project, etc.)'
                        },
                        relatedType: { 
                            type: 'string', 
                            example: 'LEAVE_REQUEST', 
                            nullable: true,
                            description: 'Type of the related entity'
                        },
                        actionUrl: { 
                            type: 'string', 
                            example: '/leave/history', 
                            nullable: true,
                            description: 'URL for the user to take action on this notification'
                        },
                        createdAt: { 
                            type: 'string', 
                            format: 'date-time',
                            example: '2024-01-13T10:30:00Z',
                            description: 'Timestamp when the notification was created'
                        },
                        updatedAt: { 
                            type: 'string', 
                            format: 'date-time',
                            example: '2024-01-13T10:30:00Z',
                            description: 'Timestamp when the notification was last updated'
                        }
                    }
                },
                NotificationSummary: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            example: 25,
                            description: 'Total number of notifications'
                        },
                        unread: {
                            type: 'integer',
                            example: 5,
                            description: 'Number of unread notifications'
                        },
                        read: {
                            type: 'integer',
                            example: 20,
                            description: 'Number of read notifications'
                        },
                        byType: {
                            type: 'object',
                            properties: {
                                leaveRequest: { type: 'integer', example: 2 },
                                leaveApproved: { type: 'integer', example: 1 },
                                leaveRejected: { type: 'integer', example: 0 },
                                taskAssigned: { type: 'integer', example: 3 },
                                taskOverdue: { type: 'integer', example: 1 },
                                projectDeadline: { type: 'integer', example: 2 },
                                teamUpdate: { type: 'integer', example: 1 },
                                systemAlert: { type: 'integer', example: 0 }
                            },
                            description: 'Breakdown of unread notifications by type'
                        }
                    }
                },

                // Invitation Schemas
                Invitation: {
                    type: 'object',
                    properties: {
                        id: { 
                            type: 'string', 
                            example: 'invitation-uuid-123',
                            description: 'Unique invitation identifier'
                        },
                        email: { 
                            type: 'string', 
                            format: 'email', 
                            example: 'newuser@signity.com',
                            description: 'Email address of the invited person'
                        },
                        name: { 
                            type: 'string', 
                            example: 'John Doe',
                            description: 'Full name of the invited person'
                        },
                        role: { 
                            type: 'string', 
                            enum: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], 
                            example: 'EMPLOYEE',
                            description: 'Role to be assigned to the invited user'
                        },
                        status: { 
                            type: 'string', 
                            enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'], 
                            example: 'PENDING',
                            description: 'Current status of the invitation'
                        },
                        companyId: {
                            type: 'string',
                            example: 'company-uuid-123',
                            description: 'ID of the company the user is invited to'
                        },
                        departmentId: {
                            type: 'string',
                            nullable: true,
                            example: 'dept-uuid-123',
                            description: 'Optional department ID to assign the user to'
                        },
                        invitedBy: {
                            type: 'string',
                            example: 'admin-uuid-123',
                            description: 'ID of the user who sent the invitation'
                        },
                        token: {
                            type: 'string',
                            example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
                            description: 'Unique token for invitation acceptance (not returned in API responses)'
                        },
                        expiresAt: { 
                            type: 'string', 
                            format: 'date-time',
                            example: '2024-01-20T10:30:00Z',
                            description: 'Timestamp when the invitation expires'
                        },
                        acceptedAt: { 
                            type: 'string', 
                            format: 'date-time', 
                            nullable: true,
                            example: null,
                            description: 'Timestamp when the invitation was accepted'
                        },
                        createdAt: { 
                            type: 'string', 
                            format: 'date-time',
                            example: '2024-01-13T10:30:00Z',
                            description: 'Timestamp when the invitation was created'
                        },
                        updatedAt: { 
                            type: 'string', 
                            format: 'date-time',
                            example: '2024-01-13T10:30:00Z',
                            description: 'Timestamp when the invitation was last updated'
                        }
                    }
                },
                InvitationRequest: {
                    type: 'object',
                    required: ['email', 'name', 'role'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@signity.com',
                            description: 'Email address of the person to invite'
                        },
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 100,
                            example: 'John Doe',
                            description: 'Full name of the person to invite'
                        },
                        role: {
                            type: 'string',
                            enum: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
                            example: 'EMPLOYEE',
                            description: 'Role to assign to the new user'
                        },
                        departmentId: {
                            type: 'string',
                            example: 'dept-uuid-123',
                            description: 'Optional department ID to assign the user to'
                        }
                    }
                },
                AcceptInvitationRequest: {
                    type: 'object',
                    required: ['token', 'password'],
                    properties: {
                        token: {
                            type: 'string',
                            example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
                            description: 'Invitation token received via email'
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            example: 'SecurePassword123',
                            description: 'Password for the new account (minimum 8 characters)'
                        }
                    }
                },

                // Profile Management Schemas
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'user-uuid-123',
                            description: 'Unique user identifier'
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe',
                            description: 'Full name of the user'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@signity.com',
                            description: 'Email address of the user'
                        },
                        role: {
                            type: 'string',
                            enum: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
                            example: 'EMPLOYEE',
                            description: 'Role of the user in the organization'
                        },
                        companyId: {
                            type: 'string',
                            example: 'company-uuid-123',
                            description: 'ID of the company the user belongs to'
                        },
                        departmentId: {
                            type: 'string',
                            nullable: true,
                            example: 'dept-uuid-123',
                            description: 'ID of the department the user belongs to'
                        },
                        teamId: {
                            type: 'string',
                            nullable: true,
                            example: 'team-uuid-123',
                            description: 'ID of the team the user belongs to'
                        },
                        isEmailVerified: {
                            type: 'boolean',
                            example: true,
                            description: 'Whether the user\'s email is verified'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true,
                            description: 'Whether the user account is active'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-01T10:30:00Z',
                            description: 'Timestamp when the user account was created'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-13T10:30:00Z',
                            description: 'Timestamp when the user account was last updated'
                        },
                        company: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: 'company-uuid-123' },
                                name: { type: 'string', example: 'Signity Solutions' },
                                slug: { type: 'string', example: 'signity' },
                                isActive: { type: 'boolean', example: true },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        },
                        department: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'string', example: 'dept-uuid-123' },
                                name: { type: 'string', example: 'Engineering' },
                                description: { type: 'string', example: 'Software development team' }
                            }
                        },
                        team: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'string', example: 'team-uuid-123' },
                                name: { type: 'string', example: 'Frontend Development Team' },
                                description: { type: 'string', example: 'React and TypeScript specialists' }
                            }
                        }
                    }
                },
                UpdateProfileRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 100,
                            example: 'John Doe',
                            description: 'Updated full name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@company.com',
                            description: 'Updated email address (must be unique within company)'
                        }
                    }
                },
                ChangePasswordRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: {
                            type: 'string',
                            example: 'currentPassword123',
                            description: 'Current password for verification'
                        },
                        newPassword: {
                            type: 'string',
                            minLength: 8,
                            example: 'newSecurePassword123',
                            description: 'New password (minimum 8 characters)'
                        }
                    }
                },
                CompanyInfo: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'company-uuid-123',
                            description: 'Unique company identifier'
                        },
                        name: {
                            type: 'string',
                            example: 'Signity Solutions',
                            description: 'Company name'
                        },
                        slug: {
                            type: 'string',
                            example: 'signity',
                            description: 'Company slug/identifier'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true,
                            description: 'Whether the company is active'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-01T00:00:00Z',
                            description: 'Timestamp when the company was created'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-13T10:30:00Z',
                            description: 'Timestamp when the company was last updated'
                        },
                        statistics: {
                            type: 'object',
                            properties: {
                                totalEmployees: {
                                    type: 'integer',
                                    example: 45,
                                    description: 'Total number of active employees'
                                },
                                totalDepartments: {
                                    type: 'integer',
                                    example: 8,
                                    description: 'Total number of active departments'
                                },
                                totalTeams: {
                                    type: 'integer',
                                    example: 12,
                                    description: 'Total number of active teams'
                                },
                                totalProjects: {
                                    type: 'integer',
                                    example: 25,
                                    description: 'Total number of active projects'
                                }
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: '🔐 **User Authentication & Authorization**\n\nComplete authentication system with JWT tokens, role-based access control, and secure login/logout functionality.\n\n**Key Features:**\n- JWT token-based authentication\n- Role-based authorization (Admin, HR, Manager, Employee)\n- Secure password handling\n- Token refresh capabilities\n- Session management'
            },
            {
                name: 'Admin Authentication',
                description: '👑 **Admin-Specific Authentication**\n\nSecure admin account creation with OTP verification for enhanced security.\n\n**Key Features:**\n- OTP-based admin signup\n- Email verification\n- Secure admin account creation\n- Enhanced security measures\n- Admin-only access controls'
            },
            {
                name: 'User Management',
                description: '👥 **User CRUD Operations & Profile Management**\n\nComprehensive user management system for creating, updating, and managing user accounts across the organization.\n\n**Key Features:**\n- User creation and updates\n- Role assignment and management\n- User activation/deactivation\n- Profile management\n- Company-wide user directory\n- Bulk user operations'
            },
            {
                name: 'Department Management',
                description: '🏢 **Department Structure & Organization**\n\nManage organizational departments, assign users, and maintain company structure.\n\n**Key Features:**\n- Department creation and management\n- User assignment to departments\n- Department statistics and analytics\n- Organizational hierarchy\n- Department-based reporting'
            },
            {
                name: 'Teams',
                description: '🤝 **Team Management & Collaboration**\n\nComplete team management system with member assignment, performance tracking, and workload analysis.\n\n**Key Features:**\n- Team creation and management\n- Member assignment and reassignment\n- Team performance metrics\n- Workload analysis and distribution\n- Team structure visualization\n- Manager-specific team controls\n\n**Role Access:**\n- **ADMIN/HR**: Full access to all teams\n- **MANAGER**: Manage assigned teams only\n- **EMPLOYEE**: View team information'
            },
            {
                name: 'Project Management',
                description: '📋 **Project Lifecycle & Tracking**\n\nEnd-to-end project management with task assignment, progress tracking, and team collaboration.\n\n**Key Features:**\n- Project creation and assignment\n- Progress tracking and milestones\n- Team and resource allocation\n- Project analytics and reporting\n- Deadline management\n- Status updates and notifications'
            },
            {
                name: 'Task Management',
                description: '✅ **Task Assignment & Tracking**\n\nDetailed task management with assignments, status updates, comments, and progress tracking.\n\n**Key Features:**\n- Task creation and assignment\n- Status tracking and updates\n- Priority management\n- Task comments and collaboration\n- Time estimation and tracking\n- Task dependencies'
            },
            {
                name: 'Work Logs',
                description: '⏰ **Time Tracking & Work Log Management**\n\nComprehensive time tracking system with approval workflows and productivity analytics.\n\n**Key Features:**\n- Daily work log entries\n- Time tracking and validation\n- Manager approval workflows\n- Productivity analytics\n- Overtime tracking\n- Work log reporting'
            },
            {
                name: 'Leave Management',
                description: '🏖️ **Leave Applications & Approval System**\n\nComplete leave management system with applications, approvals, balance tracking, and calendar integration.\n\n**Key Features:**\n- Leave application submission\n- Manager/HR approval workflows\n- Leave balance tracking\n- Leave type management\n- Calendar integration\n- Leave history and reporting\n- Bulk leave operations'
            },
            {
                name: 'Notifications',
                description: '🔔 **Real-time Notification System**\n\nComprehensive notification system for keeping users informed about important updates and actions.\n\n**Key Features:**\n- Real-time notifications\n- Email and in-app notifications\n- Notification preferences\n- Read/unread status tracking\n- Notification history\n- Custom notification types'
            },
            {
                name: 'Invitations',
                description: '📧 **Member Invitation & Onboarding**\n\nStreamlined invitation system for onboarding new team members with role-based access.\n\n**Key Features:**\n- Email-based invitations\n- Role-specific invitations\n- Invitation tracking and management\n- Expiration handling\n- Bulk invitation capabilities\n- Onboarding workflows'
            },
            {
                name: 'Profile Management',
                description: '👤 **Personal Profile & Company Information**\n\nUser profile management with personal information, company details, and account settings.\n\n**Key Features:**\n- Personal profile updates\n- Company information access\n- Account settings management\n- Profile picture uploads\n- Contact information management\n- Privacy settings'
            },
            {
                name: 'Dashboard',
                description: '📊 **Role-based Dashboard Analytics**\n\nCustomized dashboards with role-specific metrics, statistics, and quick access to important information.\n\n**Key Features:**\n- Role-based dashboard views\n- Real-time statistics\n- Quick action buttons\n- Performance metrics\n- Recent activity feeds\n- Customizable widgets'
            },
            {
                name: 'Analytics',
                description: '📈 **Comprehensive Analytics & Reporting**\n\nAdvanced analytics and reporting system for HR, management, and organizational insights.\n\n**Key Features:**\n- Team performance analytics\n- Project success metrics\n- Employee productivity reports\n- Leave pattern analysis\n- Workload distribution reports\n- Custom report generation\n- Data export capabilities'
            },
            {
                name: 'Testing',
                description: '🧪 **Test Endpoints & System Validation**\n\nTest endpoints for validating role-based access control, system functionality, and API testing.\n\n**Key Features:**\n- Role-based access testing\n- System health checks\n- Email functionality testing\n- Authentication validation\n- Permission testing\n- API endpoint validation'
            }
        ]
    },
    apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
    // Swagger UI with enhanced configuration
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: `
            .swagger-ui .topbar { display: none }
            .swagger-ui .info { margin: 20px 0; }
            .swagger-ui .info .title { color: #2c3e50; font-size: 2.5em; }
            .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
            .swagger-ui .scheme-container { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white;
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0;
            }
            .swagger-ui .auth-wrapper { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                border: 2px solid #007bff;
            }
            .swagger-ui .opblock.opblock-post { border-color: #28a745; }
            .swagger-ui .opblock.opblock-get { border-color: #007bff; }
            .swagger-ui .opblock.opblock-put { border-color: #ffc107; }
            .swagger-ui .opblock.opblock-delete { border-color: #dc3545; }
            .swagger-ui .opblock-tag { 
                font-size: 1.3em; 
                font-weight: bold;
                border-bottom: 2px solid #dee2e6;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
        `,
        customSiteTitle: 'Signity HRMS API - Complete Testing Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            defaultModelsExpandDepth: 3,
            defaultModelExpandDepth: 3,
            tryItOutEnabled: true,
            requestInterceptor: (req: any) => {
                // Add custom headers or modify requests
                req.headers['X-API-Version'] = '2.1.0';
                return req;
            },
            responseInterceptor: (res: any) => {
                // Log responses for debugging
                console.log('API Response:', res.status, res.url);
                return res;
            }
        }
    }));

    // JSON endpoint
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Enhanced API Documentation landing page
    app.get('/api-docs-info', (req, res) => {
        res.json({
            title: 'Signity HRMS API - Complete Testing Documentation',
            version: '2.1.0',
            description: 'Comprehensive API documentation for Signity HRMS Backend with enhanced testing capabilities',
            server: {
                development: 'http://localhost:3001',
                production: 'https://api.signity.com'
            },
            endpoints: {
                interactive: 'http://localhost:3001/api-docs',
                json: 'http://localhost:3001/api-docs.json',
                testing_guide: 'See SWAGGER_API_TESTING_GUIDE.md',
                complete_docs: 'See COMPLETE_API_DOCUMENTATION.md'
            },
            features: [
                '🔐 Role-based access control (Admin, HR, Manager, Employee)',
                '📋 Complete project and task management with analytics',
                '⏰ Advanced time tracking and work log management',
                '🏖️ Comprehensive leave management with approval workflows',
                '🔔 Real-time notifications system with WebSocket support',
                '📊 Advanced analytics and reporting capabilities',
                '🤝 Team performance metrics and workload analysis',
                '🏢 Department and organizational structure management',
                '📧 Invitation system for seamless onboarding',
                '👑 OTP-based secure authentication system',
                '📈 Enterprise-grade performance calculations',
                '🔄 Real-time data synchronization',
                '📱 Mobile-responsive API design',
                '🛡️ Comprehensive security and audit logging'
            ],
            authentication: {
                type: 'Bearer Token (JWT)',
                header: 'Authorization: Bearer <token>',
                obtain_token: 'POST /api/auth/login or POST /api/auth/admin/verify-signup-otp',
                token_expiry: '24 hours',
                refresh_available: true
            },
            quick_start: {
                step_1: {
                    title: 'Create Admin Account',
                    endpoint: 'POST /api/auth/admin/request-signup-otp',
                    description: 'Request OTP for admin account creation'
                },
                step_2: {
                    title: 'Verify OTP & Create Admin',
                    endpoint: 'POST /api/auth/admin/verify-signup-otp',
                    description: 'Verify OTP and create admin account'
                },
                step_3: {
                    title: 'Login & Get Token',
                    endpoint: 'POST /api/auth/login',
                    description: 'Login with credentials to get JWT token'
                },
                step_4: {
                    title: 'Set Authorization',
                    description: 'Click "Authorize" button in Swagger UI and enter: Bearer <your-token>'
                },
                step_5: {
                    title: 'Start Testing',
                    description: 'Use "Try it out" feature on any endpoint'
                }
            },
            api_statistics: {
                total_endpoints: '150+',
                authentication_endpoints: 8,
                user_management_endpoints: 15,
                project_management_endpoints: 25,
                team_management_endpoints: 12,
                leave_management_endpoints: 18,
                analytics_endpoints: 20,
                notification_endpoints: 8,
                testing_endpoints: 6
            },
            testing_features: [
                '✅ Interactive testing directly in browser',
                '📝 Complete request/response examples',
                '🔍 Detailed schema validation',
                '❌ Comprehensive error response documentation',
                '👥 Role-based testing scenarios',
                '📊 Real-time response monitoring',
                '🔄 Request/response interceptors',
                '📋 Copy-paste curl commands',
                '🎯 Endpoint filtering and search',
                '📱 Mobile-friendly testing interface'
            ],
            important_notes: [
                '🌐 Server runs on http://localhost:3001 (NOT 3000)',
                '📅 All timestamps are in ISO 8601 format',
                '📄 Pagination available on list endpoints (page, limit)',
                '📁 File uploads supported for profile pictures',
                '🔔 Real-time notifications via WebSocket',
                '📋 Comprehensive audit logging for all operations',
                '🔒 Company isolation ensures data security',
                '⚡ Rate limiting applied to prevent abuse',
                '🔄 Automatic token refresh on expiry',
                '📊 Request/response logging for debugging'
            ],
            support: {
                email: 'support@signity.com',
                documentation: 'Complete API guides available in project',
                testing_guide: 'SWAGGER_API_TESTING_GUIDE.md',
                troubleshooting: 'Check server logs for detailed error information'
            },
            last_updated: new Date().toISOString(),
            api_health: 'All systems operational ✅'
        });
    });

    console.log('📚 Swagger documentation available at http://localhost:3001/api-docs');
    console.log('📋 API info endpoint available at http://localhost:3001/api-docs-info');
    console.log('📄 JSON schema available at http://localhost:3001/api-docs.json');
};