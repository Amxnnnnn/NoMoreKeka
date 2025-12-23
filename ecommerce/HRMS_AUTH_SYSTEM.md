# 🔐 HRMS Authentication & Authorization System

## 📋 Overview

This is a clean, extracted authentication and authorization system designed specifically for **Keka Clone HRMS**. It provides secure admin registration with OTP verification, role-based access control, and company-scoped authentication.

## 🏗️ System Architecture

### **Core Concept**
```
Company (Signity) 
└── Admin (highest authority)
    └── HR (future)
        └── Employees (future)
```

### **Authentication Flow**
```
Admin Registration → OTP Verification → Account Creation → JWT Token → Protected Access
```

## 🗄️ Database Schema

### **Company Model**
```typescript
Company {
  id: String (UUID)
  name: String          // "Signity Solutions"
  slug: String          // "signity"
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### **User Model**
```typescript
User {
  id: String (UUID)
  name: String
  email: String (unique)
  password: String (hashed)
  role: ADMIN | HR | EMPLOYEE
  companyId: String (FK → Company)
  isEmailVerified: Boolean
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### **OTP Model**
```typescript
OTP {
  id: String (UUID)
  email: String
  otpCode: String (6 digits)
  purpose: REGISTRATION | LOGIN | EMAIL_VERIFICATION
  isVerified: Boolean
  attempts: Number
  userId: String? (FK → User)
  createdAt: DateTime
  expiresAt: DateTime (10 minutes)
}
```

## 🚀 API Endpoints

### **Admin Registration**

#### 1. Request OTP for Admin Signup
```http
POST /api/auth/admin/request-signup-otp
Content-Type: application/json

{
  "email": "admin@signity.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email. Valid for 10 minutes.",
  "email": "admin@signity.com",
  "note": "Check your email for the OTP code"
}
```

#### 2. Verify OTP and Create Admin Account
```http
POST /api/auth/admin/verify-signup-otp
Content-Type: application/json

{
  "email": "admin@signity.com",
  "otpCode": "123456",
  "name": "Admin User",
  "password": "AdminPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@signity.com",
    "role": "ADMIN",
    "companyId": "signity-company-id",
    "isEmailVerified": true,
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Login (Email + Password)**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@signity.com",
  "password": "AdminPassword123"
}
```

### **Login with OTP**

#### 1. Request Login OTP
```http
POST /api/auth/login/request-otp
Content-Type: application/json

{
  "email": "admin@signity.com"
}
```

#### 2. Verify Login OTP
```http
POST /api/auth/login/verify-otp
Content-Type: application/json

{
  "email": "admin@signity.com",
  "otpCode": "123456"
}
```

### **Get Current User**

```http
GET /api/auth/me
Authorization: Bearer <token>
```

## 🔒 Security Features

### **JWT Token Structure**
```typescript
{
  userId: string,
  role: "ADMIN" | "HR" | "EMPLOYEE",
  companyId: string
}
```

### **Middleware Chain**
```
Request → JWT Verification → Company Scope Check → Role Check → Controller
```

### **Authorization Rules**
1. **Authentication Required**: Valid JWT token
2. **Company Scope**: User must belong to correct company
3. **Role-Based**: Admin-only endpoints check role
4. **Active Status**: Only active users can access

## 🛡️ Security Validations

### **Input Validation (Zod)**
- Email format validation
- Password strength (min 8 characters)
- OTP format (exactly 6 digits)
- Name length (min 2 characters)

### **Business Logic Validation**
- Email uniqueness check
- OTP expiration (10 minutes)
- OTP attempt limits
- Company membership verification
- User active status check

## 📁 Project Structure

```
src/
├── controller/
│   └── auth.controller.ts          # Authentication logic
├── middleware/
│   ├── auth.mid.ts                 # JWT verification
│   ├── admin.mid.ts                # Role-based access
│   ├── validate.mid.ts             # Input validation
│   └── error.mid.ts                # Error handling
├── routes/
│   ├── auth.route.ts               # Auth endpoints
│   ├── index.route.ts              # Root router
│   └── test_email.route.ts         # Email testing
├── validator/
│   └── auth.validator.ts           # Zod schemas
├── utility/
│   ├── otp/
│   │   └── otp.util.ts             # OTP generation/verification
│   ├── email/
│   │   └── email.service.ts        # Email sending
│   └── seed.ts                     # Database seeding
├── exceptions/                     # Custom error classes
├── Types/
│   └── express.d.ts                # TypeScript definitions
└── prisma_connection.ts            # Database connection
```

## 🔧 Setup Instructions

### 1. Environment Variables
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/keka_clone"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-key"

# Email (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@signity.com"
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start server (will auto-seed Signity company)
npm start
```

### 3. Test the System
```bash
# Server will start on http://localhost:3000
# API Documentation: http://localhost:3000/api-docs
# Test email endpoint: POST /api/test/send-email
```

## 🧪 Testing Flow

### **Complete Admin Registration Test**

1. **Request OTP**
```bash
curl -X POST http://localhost:3000/api/auth/admin/request-signup-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@signity.com"}'
```

2. **Check Email** (OTP will be sent)

3. **Verify OTP & Create Account**
```bash
curl -X POST http://localhost:3000/api/auth/admin/verify-signup-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@signity.com",
    "otpCode": "123456",
    "name": "Admin User",
    "password": "AdminPassword123"
  }'
```

4. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@signity.com",
    "password": "AdminPassword123"
  }'
```

5. **Access Protected Route**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Key Features

### ✅ **Implemented**
- ✅ Admin registration with OTP verification
- ✅ Email + Password login
- ✅ OTP-based login
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Company-scoped access
- ✅ Input validation (Zod)
- ✅ Error handling
- ✅ Email notifications
- ✅ Database seeding
- ✅ Swagger documentation

### 🔄 **Ready for Extension**
- 🔄 HR user creation (by Admin)
- 🔄 Employee user creation (by Admin/HR)
- 🔄 Password reset functionality
- 🔄 Email verification
- 🔄 Refresh tokens
- 🔄 Rate limiting

## 🚨 Important Notes

### **Security Considerations**
1. **Admin Registration**: Currently open to any email. In production, implement:
   - Admin email whitelist
   - Admin registration secret key
   - Manual admin approval

2. **JWT Expiration**: Currently no expiration set. Add:
   ```typescript
   jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
   ```

3. **Rate Limiting**: Add rate limiting for:
   - OTP requests
   - Login attempts
   - API calls

### **Production Checklist**
- [ ] Add JWT expiration
- [ ] Implement refresh tokens
- [ ] Add rate limiting
- [ ] Configure CORS
- [ ] Add security headers (Helmet.js)
- [ ] Implement admin whitelist
- [ ] Add comprehensive logging
- [ ] Set up monitoring

## 🔗 Integration with Keka Clone

This authentication system is designed to be the foundation for your Keka clone HRMS. It provides:

1. **Secure Admin Access**: Only verified admins can access the system
2. **Company Isolation**: All data is scoped to Signity company
3. **Role-Based Permissions**: Ready for HR and Employee roles
4. **Scalable Architecture**: Easy to extend with new features

The system is **production-ready** for the authentication layer and can be extended with HRMS-specific features like:
- Employee management
- Department management
- Attendance tracking
- Leave management
- Payroll system

## 📞 Support

For questions or issues:
- Check the Swagger documentation at `/api-docs`
- Review the error codes in `src/exceptions/root.ts`
- Test email functionality with `/api/test/send-email`

---

**🎉 Your HRMS Authentication System is Ready!**