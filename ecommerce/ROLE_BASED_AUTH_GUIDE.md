# Role-Based Authorization System

## Overview

This document explains the comprehensive role-based access control (RBAC) system implemented in the NoMoreKeka HRMS backend.

## Role Hierarchy

The system supports three user roles with different permission levels:

1. **ADMIN** - Full system access
2. **HR** - Human resources management access
3. **EMPLOYEE** - Basic employee access

## Middleware Components

### 1. Authentication Middleware (`authMiddleware`)

**Location:** `src/middleware/auth.mid.ts`

**Purpose:** Verifies JWT token and attaches user to request

**Usage:**
```typescript
import { authMiddleware } from '@/middleware/auth.mid';

router.get('/protected', authMiddleware, controller);
```

**What it does:**
- Extracts JWT token from Authorization header
- Verifies token signature
- Fetches user from database
- Checks if user is active
- Verifies company match
- Attaches user object to `req.user`

### 2. Admin Middleware (`adminMiddleware`)

**Location:** `src/middleware/admin.mid.ts`

**Purpose:** Restricts access to ADMIN role only

**Usage:**
```typescript
import { adminMiddleware } from '@/middleware/admin.mid';

router.delete('/users/:id', authMiddleware, adminMiddleware, controller);
```

**Access:** ADMIN only

### 3. HR Middleware (`hrMiddleware`)

**Location:** `src/middleware/admin.mid.ts`

**Purpose:** Allows ADMIN and HR roles

**Usage:**
```typescript
import { hrMiddleware } from '@/middleware/admin.mid';

router.get('/users', authMiddleware, hrMiddleware, controller);
```

**Access:** ADMIN, HR

### 4. Employee Middleware (`employeeMiddleware`)

**Location:** `src/middleware/admin.mid.ts`

**Purpose:** Allows all authenticated users

**Usage:**
```typescript
import { employeeMiddleware } from '@/middleware/admin.mid';

router.get('/profile', authMiddleware, employeeMiddleware, controller);
```

**Access:** ADMIN, HR, EMPLOYEE

### 5. Role Middleware Factory (`roleMiddleware`)

**Location:** `src/middleware/admin.mid.ts`

**Purpose:** Creates custom middleware for specific role combinations

**Usage:**
```typescript
import { roleMiddleware } from '@/middleware/admin.mid';

// Allow only ADMIN and HR
router.get('/reports', authMiddleware, roleMiddleware(['ADMIN', 'HR']), controller);

// Allow only EMPLOYEE
router.get('/my-tasks', authMiddleware, roleMiddleware(['EMPLOYEE']), controller);
```

**Access:** Custom role combinations

### 6. Self or Admin Middleware (`selfOrAdminMiddleware`)

**Location:** `src/middleware/admin.mid.ts`

**Purpose:** Allows users to access their own resources or admins/HR to access any resource

**Usage:**
```typescript
import { selfOrAdminMiddleware } from '@/middleware/admin.mid';

// Users can only access their own profile, but Admin/HR can access any
router.get('/users/:userId', authMiddleware, selfOrAdminMiddleware('userId'), controller);
```

**Access:** 
- ADMIN: Can access any user's data
- HR: Can access any user's data
- EMPLOYEE: Can only access their own data (when userId matches their ID)

### 7. Company Isolation Middleware (`companyIsolationMiddleware`)

**Location:** `src/middleware/admin.mid.ts`

**Purpose:** Ensures users can only access resources within their company (multi-tenant support)

**Usage:**
```typescript
import { companyIsolationMiddleware } from '@/middleware/admin.mid';

router.use(authMiddleware);
router.use(companyIsolationMiddleware);
```

**What it does:**
- Adds `req.companyId` to the request
- Ensures all database queries filter by company

## API Endpoints with Role Requirements

### Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/admin/request-signup-otp` | POST | Public | Request OTP for admin registration |
| `/admin/verify-signup-otp` | POST | Public | Verify OTP and create admin account |
| `/login` | POST | Public | Login with email/password |
| `/me` | GET | Authenticated | Get current user profile |

### User Management Endpoints (`/api/users`)

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/` | GET | ADMIN, HR | Get all users in company |
| `/profile` | GET | All Authenticated | Get current user's profile |
| `/role/:role` | GET | ADMIN, HR | Get users by role |
| `/:userId` | GET | Self or ADMIN/HR | Get user by ID |
| `/:userId` | PUT | Self or ADMIN/HR | Update user (role changes require ADMIN) |
| `/:userId` | DELETE | ADMIN | Deactivate user |

### Test Endpoints (`/api/test`)

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/send-email` | POST | Public | Test email functionality |
| `/admin-only` | GET | ADMIN | Test admin-only access |
| `/hr-level` | GET | ADMIN, HR | Test HR-level access |
| `/employee-level` | GET | All Authenticated | Test employee-level access |
| `/self-access/:userId` | GET | Self or ADMIN/HR | Test self-access control |

## Implementation Examples

### Example 1: Admin-Only Route

```typescript
import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.mid';
import { adminMiddleware } from '@/middleware/admin.mid';
import { deleteUser } from '@/controller/user.controller';

const router = Router();

// Only admins can delete users
router.delete(
    '/users/:userId',
    authMiddleware,           // 1. Verify JWT token
    adminMiddleware,          // 2. Check if user is ADMIN
    deleteUser                // 3. Execute controller
);
```

### Example 2: HR-Level Route

```typescript
import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.mid';
import { hrMiddleware, companyIsolationMiddleware } from '@/middleware/admin.mid';
import { getAllUsers } from '@/controller/user.controller';

const router = Router();

// Admins and HR can view all users
router.get(
    '/users',
    authMiddleware,              // 1. Verify JWT token
    companyIsolationMiddleware,  // 2. Add company filter
    hrMiddleware,                // 3. Check if user is ADMIN or HR
    getAllUsers                  // 4. Execute controller
);
```

### Example 3: Self-Access Route

```typescript
import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.mid';
import { selfOrAdminMiddleware } from '@/middleware/admin.mid';
import { getUserProfile } from '@/controller/user.controller';

const router = Router();

// Users can view their own profile, Admin/HR can view any profile
router.get(
    '/users/:userId',
    authMiddleware,                      // 1. Verify JWT token
    selfOrAdminMiddleware('userId'),     // 2. Check if accessing own data or is ADMIN/HR
    getUserProfile                       // 3. Execute controller
);
```

### Example 4: Custom Role Combination

```typescript
import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.mid';
import { roleMiddleware } from '@/middleware/admin.mid';
import { getReports } from '@/controller/reports.controller';

const router = Router();

// Only ADMIN and HR can access reports
router.get(
    '/reports',
    authMiddleware,                    // 1. Verify JWT token
    roleMiddleware(['ADMIN', 'HR']),   // 2. Check if user is ADMIN or HR
    getReports                         // 3. Execute controller
);
```

## Error Responses

### 401 Unauthorized

**Scenarios:**
- No token provided
- Invalid token
- Token expired
- User not found
- User inactive
- Insufficient permissions

**Response:**
```json
{
  "message": "Unauthorized - Admin access required",
  "errorCode": 4001,
  "errors": null
}
```

### 403 Forbidden

**Scenarios:**
- User trying to access another user's data (when not ADMIN/HR)
- User trying to perform action outside their role permissions

**Response:**
```json
{
  "message": "Unauthorized - You can only access your own resources",
  "errorCode": 4001,
  "errors": null
}
```

## Testing the System

### 1. Register an Admin

```bash
# Step 1: Request OTP
POST http://localhost:3000/api/auth/admin/request-signup-otp
Content-Type: application/json

{
  "email": "admin@signity.com"
}

# Step 2: Verify OTP and create account
POST http://localhost:3000/api/auth/admin/verify-signup-otp
Content-Type: application/json

{
  "email": "admin@signity.com",
  "otpCode": "123456",
  "name": "Admin User",
  "password": "AdminPassword123"
}
```

### 2. Login

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@signity.com",
  "password": "AdminPassword123"
}

# Response includes JWT token
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Test Role-Based Access

```bash
# Test Admin-only access
GET http://localhost:3000/api/test/admin-only
Authorization: Bearer YOUR_JWT_TOKEN

# Test HR-level access
GET http://localhost:3000/api/test/hr-level
Authorization: Bearer YOUR_JWT_TOKEN

# Test Employee-level access
GET http://localhost:3000/api/test/employee-level
Authorization: Bearer YOUR_JWT_TOKEN

# Test Self-access
GET http://localhost:3000/api/test/self-access/YOUR_USER_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Test User Management

```bash
# Get all users (Admin/HR only)
GET http://localhost:3000/api/users
Authorization: Bearer YOUR_JWT_TOKEN

# Get user by ID (Self or Admin/HR)
GET http://localhost:3000/api/users/USER_ID
Authorization: Bearer YOUR_JWT_TOKEN

# Update user (Self or Admin/HR)
PUT http://localhost:3000/api/users/USER_ID
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Name"
}

# Deactivate user (Admin only)
DELETE http://localhost:3000/api/users/USER_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

## Best Practices

1. **Always use `authMiddleware` first** - It must come before any role-based middleware
2. **Use `companyIsolationMiddleware`** - For multi-tenant data isolation
3. **Order matters** - Middleware executes in the order it's defined
4. **Validate input** - Use Zod schemas for request validation
5. **Handle errors** - Use the `errorHandler` wrapper for all controllers
6. **Log access** - Middleware logs all access attempts for auditing

## Security Considerations

1. **JWT Secret** - Store in environment variables, never commit to code
2. **Token Expiry** - Implement token refresh mechanism
3. **Password Hashing** - Uses bcrypt with salt rounds
4. **Company Isolation** - Prevents cross-company data access
5. **Active User Check** - Deactivated users cannot access the system
6. **Self-Deactivation Prevention** - Users cannot deactivate their own accounts

## Next Steps

1. ✅ Role-based authorization middleware implemented
2. ⏳ Connect frontend to backend APIs
3. ⏳ Implement member management APIs
4. ⏳ Add file upload functionality
5. ⏳ Implement real-time features with WebSocket
6. ⏳ Add advanced reporting and analytics

## API Documentation

Full API documentation is available at:
- Swagger UI: http://localhost:3000/api-docs
- JSON Spec: http://localhost:3000/api-docs.json