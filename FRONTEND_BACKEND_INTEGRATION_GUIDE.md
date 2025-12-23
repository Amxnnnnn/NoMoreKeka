# Frontend-Backend Integration Guide

## 🎯 **Issue Fixed: CORS Error**

The error you encountered was a **CORS (Cross-Origin Resource Sharing)** issue. The frontend (running on `http://localhost:8080`) was blocked from accessing the backend (running on `http://localhost:3000`).

### ✅ **What We Fixed:**

1. **Added CORS middleware** to the backend (`ecommerce/src/index.validator.ts`)
2. **Installed cors package** (`npm install cors @types/cors`)
3. **Configured allowed origins** for frontend access

---

## 🚀 **How to Test the Integration**

### **Step 1: Start the Backend Server**

```bash
cd ecommerce
npm start
```

**Expected Output:**
```
Connecting to PostgreSQL Database...
PostgreSQL database connected successfully!
Signity company already exists
Express server is running on port : 3000
Server URL: http://localhost:3000
API Documentation: http://localhost:3000/api-docs
CORS enabled for frontend origins
Nodemailer is ready to send emails
```

### **Step 2: Start the Frontend Server**

Open a **new terminal** and run:

```bash
cd signity-hub-main
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### **Step 3: Test the Registration Flow**

1. **Open browser:** `http://localhost:8080`
2. **Click "Register as Admin"**
3. **Enter your email** (e.g., `admin@signity.com`)
4. **Click "Send Verification Code"**

**Expected Result:**
- ✅ Success toast: "OTP Sent Successfully"
- ✅ Email received with 6-digit OTP
- ✅ Redirected to OTP verification page

5. **Enter the OTP** from your email
6. **Fill in your name** (e.g., "Admin User")
7. **Create a password** (min 8 characters)
8. **Click "Complete Registration"**

**Expected Result:**
- ✅ Success modal: "Registration Successful!"
- ✅ Automatically logged in
- ✅ Redirected to dashboard

### **Step 4: Test the Login Flow**

1. **Go to login page:** `http://localhost:8080/auth/login`
2. **Enter your email and password**
3. **Click "Sign In"**

**Expected Result:**
- ✅ Success toast: "Welcome back!"
- ✅ Redirected to dashboard
- ✅ User data loaded from backend

---

## 🔧 **CORS Configuration Details**

### **Backend CORS Settings** (`ecommerce/src/index.validator.ts`)

```typescript
app.use(cors({
    origin: [
        'http://localhost:8080',  // Vite dev server default
        'http://localhost:5173',  // Vite dev server alternative
        'http://localhost:3001',  // React dev server
        'http://localhost:3000',  // Same origin
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
```

### **What This Does:**

- **`origin`**: Allows requests from specified frontend URLs
- **`credentials: true`**: Allows cookies and authentication headers
- **`methods`**: Specifies allowed HTTP methods
- **`allowedHeaders`**: Specifies allowed request headers

---

## 📧 **Email Configuration**

### **Gmail Setup (Required for OTP emails)**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "NoMoreKeka"
   - Copy the 16-character password

3. **Update `.env` file:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=NoMoreKeka <your-email@gmail.com>
```

4. **Restart the backend server** after updating .env

---

## 🐛 **Troubleshooting**

### **Issue: CORS Error Still Appears**

**Solution:**
1. Make sure backend server is running
2. Check that CORS middleware is before route handlers
3. Restart both frontend and backend servers
4. Clear browser cache (Ctrl+Shift+Delete)

### **Issue: Email Not Sending**

**Solution:**
1. Check EMAIL_USER and EMAIL_PASSWORD in .env
2. Verify Gmail App Password is correct
3. Check backend console for Nodemailer errors
4. Ensure 2FA is enabled on Gmail

### **Issue: "User Already Exists" Error**

**Solution:**
1. Use a different email address
2. Or delete the existing user from database:
```sql
DELETE FROM users WHERE email = 'your-email@example.com';
DELETE FROM otps WHERE email = 'your-email@example.com';
```

### **Issue: OTP Expired**

**Solution:**
- OTP is valid for 10 minutes
- Request a new OTP if expired
- Check system time is correct

### **Issue: Token Invalid/Expired**

**Solution:**
1. Logout and login again
2. Clear browser localStorage
3. Check JWT_SECRET in backend .env

---

## 📊 **API Endpoints Available**

### **Authentication APIs**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/admin/request-signup-otp` | POST | Public | Request OTP for registration |
| `/api/auth/admin/verify-signup-otp` | POST | Public | Verify OTP and create account |
| `/api/auth/login` | POST | Public | Login with email/password |
| `/api/auth/me` | GET | Authenticated | Get current user profile |

### **User Management APIs**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/users` | GET | Admin/HR | Get all users |
| `/api/users/profile` | GET | Authenticated | Get own profile |
| `/api/users/:userId` | GET | Self or Admin/HR | Get user by ID |
| `/api/users/:userId` | PUT | Self or Admin/HR | Update user |
| `/api/users/:userId` | DELETE | Admin | Deactivate user |

### **Department Management APIs**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/departments` | GET | Admin/HR | Get all departments |
| `/api/departments` | POST | Admin/HR | Create new department |
| `/api/departments/:departmentId` | PUT | Admin/HR | Update department |
| `/api/departments/:departmentId` | DELETE | Admin | Delete department |
| `/api/departments/:departmentId/users` | GET | Admin/HR | Get users in department |

### **Invitation Management APIs**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/invitations` | GET | Admin/HR | Get all invitations |
| `/api/invitations` | POST | Admin/HR | Send new invitation |
| `/api/invitations/:invitationId` | DELETE | Admin/HR | Cancel invitation |
| `/api/invitations/details/:token` | GET | Public | Get invitation details |
| `/api/invitations/accept` | POST | Public | Accept invitation |

### **Dashboard APIs**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/dashboard/stats` | GET | Authenticated | Get dashboard statistics |
| `/api/dashboard/company-overview` | GET | Authenticated | Get company overview |

### **Test APIs**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/test/admin-only` | GET | Admin | Test admin access |
| `/api/test/hr-level` | GET | Admin/HR | Test HR access |
| `/api/test/employee-level` | GET | Authenticated | Test employee access |

---

## 🎨 **Frontend Environment Variables**

Create `signity-hub-main/.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

This is optional as the default is already set to `http://localhost:3000/api`.

---

## ✅ **Verification Checklist**

Before testing, ensure:

- [ ] Backend server is running on port 3000
- [ ] Frontend server is running on port 8080
- [ ] PostgreSQL database is running
- [ ] Email credentials are configured in .env
- [ ] CORS is enabled in backend
- [ ] Both servers show no errors in console

---

## 🔐 **Security Notes**

1. **Never commit .env files** to version control
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** in production
4. **Restrict CORS origins** in production to your actual domain
5. **Use environment-specific configs** for dev/staging/prod

---

## 📝 **Next Steps After Integration Works**

1. ✅ Test complete registration flow
2. ✅ Test login flow
3. ✅ Test JWT token persistence
4. ✅ Integrate dashboard with real user data
5. ✅ Connect members page to user APIs
6. ✅ Add route protection for authenticated pages
7. ✅ Implement member invitation system
8. ✅ Add department management APIs
9. ✅ Connect invitation acceptance flow
10. ⏳ Add member detail pages
11. ⏳ Add department management UI
12. ⏳ Add invitation management (cancel, resend)

## 🎉 **Latest Updates - All Core Features Complete!**

### ✅ **What's Now Working:**

1. **Complete Department Integration**
   - Backend APIs for department CRUD operations
   - Frontend services for department management
   - Members page shows actual department names
   - Department selection in invitation form

2. **Full Invitation System**
   - Send invitations with department assignment
   - Email notifications with invitation links
   - Public invitation acceptance page
   - Real-time invitation status tracking
   - Integration with authentication system

3. **Enhanced Members Management**
   - Real department data display
   - Search by name, email, or department
   - Role-based filtering
   - Loading states and error handling

4. **New Routes Added:**
   - `/auth/accept-invitation` - Public invitation acceptance
   - All department and invitation APIs registered

### 🔧 **Backend Routes Fixed:**
- ✅ Department routes now registered at `/api/departments`
- ✅ Invitation routes now registered at `/api/invitations`
- ✅ All middleware and controllers working properly

### 🎨 **Frontend Features Added:**
- ✅ Department service with full API integration
- ✅ Invitation service with acceptance flow
- ✅ AcceptInvitation page with form validation
- ✅ Enhanced InviteMembers page with real data
- ✅ Updated Members page with department display

---

## 🆘 **Need Help?**

If you encounter any issues:

1. **Check backend console** for error messages
2. **Check frontend console** for network errors
3. **Check browser Network tab** to see API requests/responses
4. **Verify .env variables** are loaded correctly
5. **Restart both servers** after any configuration changes

---

## 🎉 **Success Indicators**

You'll know everything is working when:

- ✅ No CORS errors in browser console
- ✅ OTP email is received within seconds
- ✅ Registration completes successfully
- ✅ Login works with created credentials
- ✅ Dashboard shows user information
- ✅ JWT token is stored in localStorage
- ✅ API calls include Authorization header

---

**Happy Coding! 🚀**