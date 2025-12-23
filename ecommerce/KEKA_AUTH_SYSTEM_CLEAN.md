# Keka Clone - Clean Authentication & Authorization System

## 🎯 **System Overview**

This is a clean, production-ready authentication & authorization system extracted for a Keka-like HRMS with:
- **Default Company**: Signity Solutions (pre-seeded)
- **Admin Registration**: Secure OTP-based signup
- **Role-Based Access**: ADMIN, HR, EMPLOYEE
- **JWT Authentication**: Stateless token-based auth
- **Email Verification**: OTP via Nodemailer

## 🏗️ **Architecture Flow**

```
Admin Registration Flow:
1. POST /api/auth/admin/request-signup-otp → Email OTP
2. POST /api/auth/admin/verify-signup-otp → Create Admin + JWT
3. Welcome Email → Admin Dashboard Access

Login Flow:
1. POST /api/auth/login (Email + Password)
   OR
   POST /api/auth/login/request-otp → Email OTP
   POST /api/auth/login/verify-otp → JWT

Protected Routes:
Request → JWT Middleware → Role Check → Controller
```

## 📊 **Clean Database Schema**

```prisma
// Core Authentication Schema
model Company {
  id        String   @id @default(uuid())
  name      String   // "Signity Solutions"
  slug      String   @unique // "signity"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users User[]
  @@map("companies")
}

model User {
  id              String  @id @default(uuid())
  name            String
  email           String  @unique
  password        String
  role            Role    @default(EMPLOYEE)
  companyId       String
  isEmailVerified Boolean @default(false)
  isActive        Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  otps    OTP[]

  @@map("users")
}

model OTP {
  id         String     @id @default(uuid())
  email      String
  otpCode    String
  purpose    OTPPurpose
  isVerified Boolean    @default(false)
  attempts   Int        @default(0)
  userId     String?
  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  expiresAt DateTime

  @@map("otps")
  @@index([email])
  @@index([userId])
}

enum Role {
  ADMIN
  HR
  EMPLOYEE
}

enum OTPPurpose {
  REGISTRATION
  LOGIN
  EMAIL_VERIFICATION
}
```

## 🔐 **Authentication Endpoints**

### 1. Admin Registration (Secure)
```
POST /api/auth/admin/request-signup-otp
Body: { "email": "admin@signity.com" }

POST /api/auth/admin/verify-signup-otp
Body: {
  "email": "admin@signity.com",
  "otpCode": "123456",
  "name": "Admin User",
  "password": "SecurePassword123"
}
```

### 2. Login (Dual Mode)
```
POST /api/auth/login
Body: { "email": "admin@signity.com", "password": "SecurePassword123" }

POST /api/auth/login/request-otp
Body: { "email": "admin@signity.com" }

POST /api/auth/login/verify-otp
Body: { "email": "admin@signity.com", "otpCode": "123456" }
```

### 3. Profile Access
```
GET /api/auth/me
Headers: { "Authorization": "Bearer <jwt_token>" }
```

## 🛡️ **Security Features**

1. **Password Security**: bcrypt hashing (10 rounds)
2. **JWT Tokens**: HS256 with userId, role, companyId
3. **OTP Verification**: 6-digit codes, 10-minute expiry
4. **Role-Based Access**: Middleware-enforced permissions
5. **Company Isolation**: All data scoped to Signity
6. **Email Verification**: Required for admin registration

## 📁 **Clean File Structure**

```
src/
├── controller/
│   └── auth.controller.ts          # Authentication logic
├── middleware/
│   ├── auth.mid.ts                 # JWT verification
│   ├── admin.mid.ts                # Role checking
│   ├── validate.mid.ts             # Input validation
│   └── error.mid.ts                # Error handling
├── routes/
│   ├── index.route.ts              # Root router
│   └── auth.route.ts               # Auth endpoints
├── validator/
│   └── auth.validator.ts           # Zod schemas
├── utility/
│   ├── otp/
│   │   └── otp.util.ts             # OTP generation/verification
│   ├── email/
│   │   ├── email.service.ts        # Email sending
│   │   ├── templates.ts            # Email templates
│   │   └── nodemailer.config.ts    # Email config
│   └── seed.ts                     # Company seeding
├── exceptions/                     # Custom error classes
├── Types/
│   └── express.d.ts                # Type extensions
├── index.validator.ts              # Main entry point
├── prisma_connection.ts            # Database connection
├── secret.validator.ts             # Environment variables
└── swagger.ts                      # API documentation
```

## 🚀 **Implementation Status**

✅ **Completed Features:**
- [x] Admin OTP registration
- [x] Dual login (password + OTP)
- [x] JWT authentication
- [x] Role-based authorization
- [x] Email service with templates
- [x] Company seeding (Signity)
- [x] Error handling system
- [x] Input validation (Zod)
- [x] Swagger documentation
- [x] Middleware architecture

⚠️ **Needs Cleanup:**
- [ ] Remove e-commerce related files
- [ ] Fix Swagger admin endpoints visibility
- [ ] Add JWT expiration
- [ ] Enhance security headers

## 🔧 **Files to Remove**

Remove these e-commerce related files:
```
src/controller/
├── Product.controller.ts
├── cart.controller.ts
├── Order.controller.ts
└── Address.controller.ts

src/routes/
├── products.route.ts
├── cart.route.ts
├── Order.route.ts
└── Address.route.ts

src/validator/ (cleanup)
└── Remove product/cart/order schemas from auth.validator.ts
```

## 🎯 **Next Steps**

1. **Clean Architecture**: Remove non-auth files
2. **Fix Swagger**: Ensure admin endpoints are visible
3. **Security Enhancement**: Add JWT expiration, rate limiting
4. **Testing**: Add unit tests for auth flows
5. **Documentation**: Update API docs

## 💡 **Key Insights**

1. **Admin is Special**: First user, highest authority, company owner
2. **Company Scoped**: All operations within Signity boundary
3. **Role Hierarchy**: ADMIN > HR > EMPLOYEE
4. **Security First**: OTP verification, JWT tokens, password hashing
5. **Scalable Design**: Ready for multi-tenant expansion

This system provides a solid foundation for your Keka clone with enterprise-grade authentication and authorization.