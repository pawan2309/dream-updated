# Environment Variables Setup Guide

## **🔒 Security Notice**
All hardcoded credentials have been removed from the codebase. You must set the following environment variables for the application to work properly.

## **📋 Required Environment Variables**

### **Backend (.env)**
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:8079@localhost:5432/betting_db
PG_URL=postgresql://postgres:8079@localhost:5432/betting_db

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Redis Configuration
REDIS_URL=redis://localhost:6380

# POC Authentication (for development/testing)
POC_PASSWORD=your-poc-password-here

# Test Credentials (for development/testing)
TEST_USERNAME=your-test-username
TEST_PASSWORD=your-test-password
```

### **Client Panels (.env.local)**
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4001

# Database Configuration (if needed)
DATABASE_URL=postgresql://postgres:8079@localhost:5432/betting_db
```

### **User Management (.env.local)**
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Database Configuration
DATABASE_URL=postgresql://postgres:8079@localhost:5432/betting_db
```

### **Operating Panel (.env.local)**
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Database Configuration
DATABASE_URL=postgresql://postgres:8079@localhost:5432/betting_db
```

## **🚨 Security Requirements**

### **JWT_SECRET**
- **Minimum length**: 32 characters
- **Complexity**: Include uppercase, lowercase, numbers, and special characters
- **Example**: `L9vY7z!pQkR#eA1dT3u*Xj5@FbNmC2Ws`

### **Database Passwords**
- **Never use default passwords**
- **Use strong, unique passwords**
- **Store securely in environment variables**

### **API Keys**
- **Minimum length**: 32 characters
- **Rotate regularly**
- **Store securely**

## **🔧 Setup Instructions**

### **1. Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

### **2. Client Setup**
```bash
cd client_panels
# Create .env.local with required variables
```

### **3. User Management Setup**
```bash
cd user-management/apps/frontend
# Create .env.local with required variables
```

### **4. Operating Panel Setup**
```bash
cd operating-panel/apps/frontend
# Create .env.local with required variables
```

## **✅ Verification**

After setting up environment variables:

1. **Restart all services**
2. **Check logs for configuration errors**
3. **Test authentication endpoints**
4. **Verify no hardcoded credentials in logs**

## **🔄 Environment Variable Updates**

When updating environment variables:
1. **Restart the affected service**
2. **Clear any cached configurations**
3. **Test the functionality**
4. **Update documentation**

## **📝 Notes**

- **Never commit .env files** to version control
- **Use different secrets** for development, staging, and production
- **Rotate secrets regularly** in production environments
- **Monitor logs** for any credential exposure
