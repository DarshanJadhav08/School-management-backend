# Complaint Notification System - Implementation Guide

## Overview
When a student creates a complaint, the system automatically:
1. Saves a notification record in the `notifications` table
2. Retrieves the recipient's FCM token
3. Sends a push notification via Firebase Cloud Messaging (FCM)

---

## Flow Diagram

```
Student Creates Complaint
        ↓
createComplaintController
        ↓
    ├─ Save complaint to DB
    ├─ Determine recipient(s)
    │   ├─ If recipient_user_id provided → Send to specific user
    │   ├─ If role='teacher' → Send to all teachers
    │   └─ If role='admin' → Send to all admins
    ├─ Call NotificationService
    │   ├─ Sanitize data (all values to strings)
    │   ├─ Save to notifications table
    │   ├─ Fetch user's FCM token
    │   └─ Send FCM push notification
    └─ Return success response
```

---

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  client_id UUID,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSON,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Complaint Table (Relevant Fields)
```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  client_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  role VARCHAR NOT NULL,
  target_name VARCHAR,
  recipient_user_id UUID,  -- Specific teacher/admin
  status ENUM('pending', 'resolved'),
  response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Implementation Details

### 1. Complaint Creation (`createComplaintController`)

**Location:** `src/controllers/complaint.controller.ts`

```typescript
// When complaint is created:
const notifData = { 
  type: "complaint", 
  complaint_id: complaint.id,
  sender_id: user_id,
  student_id: student.id
};

const notifTitle = "नवीन तक्रार आली";
const notifBody = `${studentName} ने तक्रार नोंदवली: "${title}"`;

// Route to correct recipient(s)
if (recipient_user_id) {
  // Specific teacher/admin
  await NotificationService.sendToUser(recipient_user_id, notifTitle, notifBody, notifData);
} else if (role?.toLowerCase() === 'teacher') {
  // All teachers
  await NotificationService.sendToAll(client_id, notifTitle, notifBody, notifData, user_id, 'teacher');
} else {
  // All admins
  await NotificationService.sendToAdmins(client_id, notifTitle, notifBody, notifData, user_id);
}
```

### 2. Notification Service (`NotificationService`)

**Location:** `src/services/notification.service.ts`

#### Method: `sendToUser()`
Sends notification to a specific user by their `user_id`.

```typescript
async sendToUser(userId: string, title: string, body: string, data?: any) {
  // 1. Sanitize data (all values must be strings for FCM)
  const sanitizedData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  // 2. Save to notifications table
  const notif = await Notification.create({
    user_id: userId,
    title,
    body,
    type: sanitizedData.type || 'general',
    data: sanitizedData,
  });

  // 3. Fetch user's FCM token
  const user = await User.findByPk(userId);
  if (!user?.fcm_token) {
    console.log(`No FCM token for user ${userId}. Saved to history only.`);
    return;
  }

  // 4. Send FCM push notification
  await admin.messaging().send({
    notification: { title, body },
    token: user.fcm_token,
    data: sanitizedData,
  });
}
```

#### Method: `sendToAll()`
Sends notification to all users of a specific role.

```typescript
async sendToAll(clientId: string, title: string, body: string, data?: any, creatorUserId?: string, targetRole: string = 'all') {
  // Fetch all users with target role
  const users = await User.findAll({
    where: { 
      client_id: clientId,
      role_name: targetRole !== 'all' ? targetRole : undefined
    },
    attributes: ["id", "fcm_token"]
  });

  // Exclude creator (student who filed complaint)
  const dbUsers = users.filter(u => u.id !== creatorUserId);

  // Save to DB
  await Notification.bulkCreate(
    dbUsers.map(u => ({
      client_id: clientId,
      user_id: u.id,
      title,
      body,
      type: sanitizedData.type || 'general',
      data: sanitizedData,
    }))
  );

  // Send FCM to all with tokens
  const tokens = dbUsers
    .map(u => u.fcm_token)
    .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

  await admin.messaging().sendEachForMulticast({
    notification: { title, body },
    tokens,
    data: sanitizedData,
  });
}
```

#### Method: `sendToAdmins()`
Sends notification to all admin/superadmin users.

```typescript
async sendToAdmins(clientId: string, title: string, body: string, data?: any, excludeUserId?: string) {
  // Fetch all admins
  const admins = await User.findAll({
    where: { 
      client_id: clientId,
      role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] }
    },
    attributes: ["id", "fcm_token"],
  });

  // Exclude student who filed complaint
  const dbAdmins = admins.filter(u => u.id !== excludeUserId);

  // Save to DB and send FCM (same as sendToAll)
}
```

---

## Notification Data Structure

### Complaint Created Notification
```json
{
  "type": "complaint",
  "complaint_id": "uuid-of-complaint",
  "sender_id": "uuid-of-student",
  "student_id": "uuid-of-student"
}
```

### Complaint Response Notification
```json
{
  "type": "complaint_response",
  "complaint_id": "uuid-of-complaint",
  "sender_id": "uuid-of-teacher-or-admin"
}
```

---

## Recipient Routing Logic

| Scenario | Recipients | Method |
|----------|-----------|--------|
| `recipient_user_id` provided | Specific teacher/admin | `sendToUser()` |
| `role='teacher'` | All teachers in school | `sendToAll(..., 'teacher')` |
| `role='admin'` | All admins in school | `sendToAdmins()` |

---

## Key Features

✅ **Database Storage**: All notifications saved to `notifications` table for history  
✅ **FCM Integration**: Push notifications sent via Firebase Cloud Messaging  
✅ **Role-Based Filtering**: Teachers/admins only receive complaints directed to them  
✅ **Sender Exclusion**: Student who filed complaint doesn't receive their own notification  
✅ **Data Sanitization**: All data values converted to strings for FCM compatibility  
✅ **Error Handling**: Graceful fallback if FCM token unavailable (saves to DB only)  
✅ **Marathi Support**: Notification titles and bodies in Marathi language  

---

## Testing Checklist

- [ ] Student creates complaint → Admin receives notification
- [ ] Student creates complaint for specific teacher → Only that teacher receives notification
- [ ] Student creates complaint for all teachers → All teachers receive notification
- [ ] Notification appears in `notifications` table with correct data
- [ ] FCM token is correctly retrieved and used
- [ ] Student doesn't receive their own complaint notification
- [ ] Complaint response notification sent to student
- [ ] Notification works offline (saved to DB, sent when online)

---

## Troubleshooting

### Notification not received?
1. Check if user has valid FCM token in `users.fcm_token`
2. Check Firebase Admin SDK initialization in logs
3. Verify notification record in `notifications` table
4. Check browser console for FCM errors

### Notification saved but FCM not sent?
- This is expected if user doesn't have FCM token
- Notification will be sent when user comes online

### Wrong recipients getting notification?
- Verify `recipient_user_id` is set correctly
- Check `role` field in complaint
- Verify user's `role_name` in users table
