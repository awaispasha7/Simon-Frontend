# Admin Panel Test Setup

## Test Admin Account Configuration

### 📧 **Test Admin Email:** `admin@storieswetell.ai`

This email has been configured as a test admin account so you can access and test the admin panel functionality.

## 🚀 **Setup Steps:**

### 1. **Environment Configuration**
The test admin email is already configured in the code. If you need to add more test emails, update your `.env.local`:

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@storieswetell.ai,another-admin@storieswetell.ai
```

### 2. **Create Test Account**
1. Go to `/auth/signup`
2. Sign up with: `admin@storieswetell.ai`
3. Use any password (e.g., `TestAdmin123!`)
4. Complete the signup process

### 3. **Access Admin Panel**
1. After signup, navigate to `/admin`
2. You should see the admin dashboard with validation queue
3. Test all the admin features

## 🧪 **Testing Workflow:**

### Test Complete Story Validation:
1. **Create a story** (as regular user or anonymous)
2. **Complete the story** (trigger validation queue)
3. **Switch to admin account** (`admin@storieswetell.ai`)
4. **Go to `/admin`** to see the validation request
5. **Test actions**:
   - View conversation transcript
   - Edit generated script  
   - Approve story → Should send email to user
   - Reject story → Should block delivery

### Admin Panel Features to Test:
- ✅ **Authentication**: Only admin emails can access
- 📊 **Statistics**: Queue counts and metrics
- 📋 **Request List**: View all validation requests
- 🔍 **Request Details**: Full transcript and script view
- ✏️ **Script Editing**: Modify scripts before approval
- ✅ **Approval**: Send approved stories to clients
- ❌ **Rejection**: Block delivery with review notes
- 🎨 **UI/UX**: Dark/light theme, responsive design

## 🔧 **Troubleshooting:**

### "Access Denied" after signup:
- Make sure you used exactly: `admin@storieswetell.ai`
- Check browser console for any errors
- Try logging out and back in

### No validation requests showing:
- Complete a story first (as different user)
- Check backend is running and validation service is working
- Look at browser network tab for API errors

### Backend not connected:
- Ensure `NEXT_PUBLIC_API_URL` points to running backend
- Check backend logs for validation queue endpoints
- Verify database has `validation_queue` table

## 🌐 **Environment Variables Needed:**

### Frontend (`.env.local`):
```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@storieswetell.ai
NEXT_PUBLIC_API_URL=http://localhost:8000
# ... other config
```

### Backend (`.env`):
```env
CLIENT_EMAIL=admin@storieswetell.ai
RESEND_API_KEY=your-resend-key
FROM_EMAIL=noreply@storieswetell.ai
# ... other config
```

## 📝 **Test Checklist:**

- [ ] Sign up with `admin@storieswetell.ai`
- [ ] Access `/admin` successfully
- [ ] See admin dashboard and statistics
- [ ] Create validation request (complete a story)
- [ ] View request in admin queue
- [ ] Edit script content
- [ ] Approve request
- [ ] Reject request with notes
- [ ] Test on mobile/desktop
- [ ] Test dark/light themes

---

**Ready to test!** The admin panel should now be fully accessible with the test account `admin@storieswetell.ai`.
