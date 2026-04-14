import * as admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { User, Student, Notification } from "../models";
import { Op } from "sequelize";


// Load configuration from Environment Variable (Render) or Local File
let serviceAccount: any = null;

const reconstructPEM = (key: string | undefined): string | undefined => {
  if (!key) return undefined;
  
  // 1. Remove Headers and Footers if they exist
  let raw = key.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                 .replace(/-----END PRIVATE KEY-----/g, '')
                 .replace(/\\n/g, '')
                 .replace(/\s/g, ''); // Remove all whitespace, newlines, and literal \n

  // 2. Extract only valid Base64 characters (Safety check)
  const base64Match = raw.match(/[A-Za-z0-9+/=]+/g);
  if (!base64Match) return undefined;
  raw = base64Match.join('');

  // 3. Chunk into 64-character lines (Standard PEM format)
  const lines = raw.match(/.{1,64}/g) || [];
  
  // 4. Rebuild the PEM
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
};

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Individual Env Vars (Most Robust)
    let privateKey = reconstructPEM(process.env.FIREBASE_PRIVATE_KEY);
    
    console.log("Firebase config loaded from individual environment variables.");
    
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
  } else if (process.env.FIREBASE_CONFIG) {
    // Legacy JSON/Base64 support
    const rawConfig = process.env.FIREBASE_CONFIG.trim();
    if (rawConfig.startsWith('{')) {
      serviceAccount = JSON.parse(rawConfig);
    } else {
      const decoded = Buffer.from(rawConfig, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
  } else {
    // Fallback to local file for development
    const serviceAccountPath = path.join(__dirname, "../config/serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    }
  }
} catch (error) {
  console.error("Firebase Config Error:", error);
}

if (serviceAccount && !admin.apps.length) {
  try {
    // Re-normalize even if loaded from JSON file
    if (serviceAccount.private_key) {
      serviceAccount.private_key = reconstructPEM(serviceAccount.private_key);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
} else if (!serviceAccount) {
  console.warn("Firebase Warning: No service account found. Notifications will be disabled.");
}

export const NotificationService = {
  /**
   * Send notification to a specific user by their User ID
   */
  async sendToUser(userId: string, title: string, body: string, data?: any) {
    try {
      // 1. Save to Database for history
      await Notification.create({
        user_id: userId,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      });

      // 2. Send FCM
      const user = await User.findByPk(userId);
      if (!user || !user.fcm_token) {
        console.log(`User ${userId} has no FCM token. Skipping FCM but saved to history.`);
        return;
      }

      const message = {
        notification: { title, body },
        token: user.fcm_token,
        data: data || {},
      };

      const response = await admin.messaging().send(message);
      console.log(`Successfully sent message to user ${userId}:`, response);
    } catch (error) {
      console.error(`Error in sendToUser for user ${userId}:`, error);
    }
  },

  /**
   * Send notification to all students of a class + Admins/SuperAdmins.
   * The creatorUserId (teacher who added the content) will:
   * - Still get a history record saved
   * - BUT will NOT receive a push notification on their device
   */
  async sendToClass(clientId: string, standard: string, title: string, body: string, data?: any, creatorUserId?: string) {
    try {
      // 1. Build standard variations for matching
      const getDigits = (s: string) => s.toString().replace(/\D/g, '');
      const digits = getDigits(standard);
      
      const standardVariations = [standard.trim(), standard.trim().toLowerCase(), standard.trim().toUpperCase()];
      if (digits && digits !== standard) {
        standardVariations.push(digits, `${digits}th`, `${digits}st`, `${digits}nd`, `${digits}rd`);
        standardVariations.push(`${digits}TH`, `${digits}ST`, `${digits}ND`, `${digits}RD`);
      }

      console.log(`[NotificationService] Delivering for Standard: "${standard}" for Client: ${clientId}. Creator (excluded from push): ${creatorUserId || 'N/A'}`);

      // 2. Find all students in this class
      let students = await Student.findAll({
        where: { 
          client_id: clientId, 
          standard: { [Op.or]: standardVariations.map(v => ({ [Op.iLike]: v })) } 
        },
        include: [{ model: User, as: "user" }],
      });

      // Broad fallback by digit matching
      if (students.length === 0 && digits) {
        console.log(`[NotificationService] No precise match. Trying broad fallback with digits: "${digits}"`);
        students = await Student.findAll({
          where: { client_id: clientId, standard: { [Op.iLike]: `%${digits}%` } },
          include: [{ model: User, as: "user" }],
        });
      }

      console.log(`[NotificationService] Found ${students.length} students.`);

      // 3. Fetch all Admin + SuperAdmin users in the school
      const adminUsers = await User.findAll({
        where: {
          client_id: clientId,
          role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] }
        },
        attributes: ['id', 'fcm_token', 'role_name'],
      });

      // 4. Build unique recipient map (Students + Admins, NO duplicates)
      const recipients = new Map<string, { fcm_token: string | null, role_name: string }>();

      // Add students
      for (const s of students as any[]) {
        const uid = s.user?.id || s.user_id;
        if (uid) {
          recipients.set(uid, { fcm_token: s.user?.fcm_token || null, role_name: 'student' });
        }
      }

      // Add admins (Map ensures no duplicates even if user appears in both)
      for (const adminUser of adminUsers) {
        if (adminUser.id) {
          recipients.set(adminUser.id as string, {
            fcm_token: adminUser.fcm_token || null,
            role_name: adminUser.role_name || 'admin',
          });
        }
      }

      console.log(`[NotificationService] Total unique recipients: ${recipients.size}`);

      // 5. Save notification history for ALL recipients (including creator)
      const notificationRecords = Array.from(recipients.keys()).map((uid) => ({
        client_id: clientId,
        user_id: uid,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      
      if (notificationRecords.length > 0) {
        await Notification.bulkCreate(notificationRecords);
        console.log(`[NotificationService] Saved ${notificationRecords.length} records to history.`);
      }

      // 6. Send FCM push ONLY to recipients who are NOT the creator
      const pushTokens = Array.from(recipients.entries())
        .filter(([uid, _]) => uid !== creatorUserId) // Exclude the teacher/creator from push
        .map(([_, info]) => info.fcm_token)
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

      if (pushTokens.length === 0) {
        console.log(`[NotificationService] No valid FCM push tokens (excluding creator). History saved.`);
        return;
      }

      console.log(`[NotificationService] Sending push to ${pushTokens.length} devices (creator excluded).`);

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens: pushTokens,
        data: data || {},
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[NotificationService] Multicast: ${response.successCount} success, ${response.failureCount} failure.`);
    } catch (error) {
      console.error("[NotificationService] Error in sendToClass:", error);
    }
  },


  /**
   * Send school-wide notification (to all users of a client)
   */
  async sendToAll(clientId: string, title: string, body: string, data?: any, creatorUserId?: string) {
    try {
      const users = await User.findAll({
        where: { client_id: clientId },
        attributes: ["id", "fcm_token"],
      });

      if (users.length === 0) return;

      // 1. Multi-save to Database
      const notificationRecords = users.map((u) => ({
        client_id: clientId,
        user_id: u.id,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      await Notification.bulkCreate(notificationRecords);

      // 2. Filter tokens (ignore creator)
      const tokens = users
          .filter(u => u.id !== creatorUserId)
          .map((u) => u.fcm_token)
          .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens: tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error in sendToAll:", error);
    }
  },

  /**
   * Send notification strictly to Administrative staff (Admin, Superadmin)
   */
  async sendToAdmins(clientId: string, title: string, body: string, data?: any) {
    try {
      const admins = await User.findAll({
        where: { 
          client_id: clientId,
          role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] }
        },
        attributes: ["id", "fcm_token"],
      });

      if (admins.length === 0) return;

      // 1. Multi-save to Database
      const notificationRecords = admins.map((u) => ({
        client_id: clientId,
        user_id: u.id,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      await Notification.bulkCreate(notificationRecords);

      // 2. Filter tokens
      const tokens = admins.map((u) => u.fcm_token).filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens: tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error in sendToAdmins:", error);
    }
  }
};
