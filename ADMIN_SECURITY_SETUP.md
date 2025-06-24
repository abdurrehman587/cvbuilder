# Admin Security Setup Guide

## Overview
The admin panel has been secured to prevent regular users from accessing sensitive information. Here's how to set it up securely:

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Admin credentials (CHANGE THESE IN PRODUCTION)
REACT_APP_ADMIN_EMAIL=your_admin_email@domain.com
REACT_APP_ADMIN_PASSWORD=your_secure_password_here

# Supabase configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Security Features Implemented

### 1. Hidden Admin Access
- Admin credentials are no longer displayed in the UI
- Admin toggle is hidden by default (opacity: 0.1)
- Only accessible via keyboard shortcut: `Ctrl + Alt + A`

### 2. Rate Limiting
- Maximum 3 failed admin login attempts
- Attempts are tracked and reset on successful login
- Clear feedback on remaining attempts

### 3. Environment Variables
- Admin credentials moved to environment variables
- Fallback to default credentials if not set
- **IMPORTANT**: Change default credentials in production

### 4. Access Control
- Admin toggle requires specific key combination
- Visual indicator when admin mode is active
- Automatic reset of failed attempts when switching to user mode

## How to Access Admin Panel

1. **Keyboard Shortcut**: Press `Ctrl + Alt + A` to reveal admin toggle
2. **Toggle to Admin**: Click the "🔐 Admin" button
3. **Enter Credentials**: Use the credentials from your `.env` file
4. **Login**: Click "Admin Login"

## Production Security Recommendations

1. **Change Default Credentials**: Always change the default admin credentials
2. **Strong Passwords**: Use strong, unique passwords for admin accounts
3. **Environment Variables**: Never commit `.env` files to version control
4. **HTTPS**: Ensure your application runs over HTTPS in production
5. **Session Management**: Consider implementing session timeouts
6. **IP Whitelisting**: Consider restricting admin access to specific IP addresses
7. **Two-Factor Authentication**: Implement 2FA for admin accounts
8. **Audit Logging**: Log all admin access attempts and actions

## Troubleshooting

### Admin Toggle Not Visible
- Press `Ctrl + Alt + A` to reveal the admin toggle
- Check browser console for any JavaScript errors

### Login Issues
- Verify environment variables are set correctly
- Check that the `.env` file is in the root directory
- Restart the development server after changing environment variables

### Rate Limiting
- Wait for the rate limit to reset (usually on page refresh)
- Switch to user mode and back to reset attempts

## Security Notes

- The admin credentials are now hidden from the UI
- Regular users cannot easily discover admin access
- Failed login attempts are limited to prevent brute force attacks
- Environment variables provide better security than hardcoded values
- The keyboard shortcut provides a hidden way to access admin features

## Default Credentials (Development Only)

For development purposes, the default credentials are:
- Email: `admin@cvbuilder.com`
- Password: `admin123456`

**⚠️ WARNING**: These should be changed immediately in production environments. 