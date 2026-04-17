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
      console.log(`[NotificationService] sendToUser: userId=${userId}, title=${title}`);

      // 1. Save to Database for history
      const notif = await Notification.create({
        user_id: userId,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      });
      console.log(`[NotificationService] Notification saved to DB: id=${notif.id}, user_id=${userId}`);

      // 2. Send FCM
      const user = await User.findByPk(userId);
      if (!user || !user.fcm_token) {
        console.log(`[NotificationService] User ${userId} has no FCM token. Skipping FCM but saved to history.`);
        return;
      }

      const message = {
        notification: { title, body },
        token: user.fcm_token,
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
      };

      const response = await admin.messaging().send(message);
      console.log(`[NotificationService] FCM sent to user ${userId}:`, response);
    } catch (error) {
      console.error(`[NotificationService] Error in sendToUser for user ${userId}:`, error);
    }
  },

  /**
   * Send notification to all students of a class + Admins/SuperAdmins.
   * The creatorUserId (teacher who added the content) will:
   * - Still get a history record saved
   * - BUT will NOT receive a push notification on their device
   */
  // includeAdmins = false by default — attendance/homework/book notifications should NOT go to admins
  async sendToClass(clientId: string, standard: string, title: string, body: string, data?: any, creatorUserId?: string, includeAdmins: boolean = false) {
    try {
      const getDigits = (s: string) => s.toString().replace(/\D/g, '');
      const digits = getDigits(standard);
      
      const standardVariations = [standard.trim(), standard.trim().toLowerCase(), standard.trim().toUpperCase()];
      if (digits && digits !== standard) {
        standardVariations.push(digits, `${digits}th`, `${digits}st`, `${digits}nd`, `${digits}rd`);
        standardVariations.push(`${digits}TH`, `${digits}ST`, `${digits}ND`, `${digits}RD`);
      }

      console.log(`[NotificationService] sendToClass: standard="${standard}" client=${clientId} includeAdmins=${includeAdmins} creator=${creatorUserId || 'N/A'}`);

      // 1. Find all students in this class
      let students = await Student.findAll({
        where: { 
          client_id: clientId, 
          standard: { [Op.or]: standardVariations.map(v => ({ [Op.iLike]: v })) } 
        },
        include: [{ model: User, as: "user" }],
      });

      if (students.length === 0 && digits) {
        students = await Student.findAll({
          where: { client_id: clientId, standard: { [Op.iLike]: `%${digits}%` } },
          include: [{ model: User, as: "user" }],
        });
      }

      console.log(`[NotificationService] Found ${students.length} students.`);

      // 2. Build recipient map — students only
      const recipients = new Map<string, { fcm_token: string | null, role_name: string }>();

      for (const s of students as any[]) {
        const uid = s.user?.id || s.user_id;
        if (uid) {
          recipients.set(uid, { fcm_token: s.user?.fcm_token || null, role_name: 'student' });
        }
      }

      // 3. Optionally include admins (only for notices/announcements)
      if (includeAdmins) {
        const adminUsers = await User.findAll({
          where: {
            client_id: clientId,
            role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] }
          },
          attributes: ['id', 'fcm_token', 'role_name'],
        });
        for (const adminUser of adminUsers) {
          if (adminUser.id) {
            recipients.set(adminUser.id as string, {
              fcm_token: adminUser.fcm_token || null,
              role_name: adminUser.role_name || 'admin',
            });
          }
        }
      }

      console.log(`[NotificationService] Total unique recipients: ${recipients.size}`);

      // 4. Save notification history for ALL recipients
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
      }

      // 5. Send FCM push ONLY to recipients who are NOT the creator
      const pushTokens = Array.from(recipients.entries())
        .filter(([uid]) => uid !== creatorUserId)
        .map(([_, info]) => info.fcm_token)
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

      if (pushTokens.length === 0) return;

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
  // targetRole: 'all' | 'student' | 'teacher' | 'admin' — filters who receives the notification
  async sendToAll(clientId: string, title: string, body: string, data?: any, creatorUserId?: string, targetRole: string = 'all') {
    try {
      const whereClause: any = { client_id: clientId };

      // Apply role filter — only send to matching role(s)
      if (targetRole && targetRole !== 'all') {
        whereClause.role_name = targetRole;
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: ["id", "fcm_token"],
      });

      if (users.length === 0) return;

      // 1. Save to DB history for all matched users
      const notificationRecords = users.map((u) => ({
        client_id: clientId,
        user_id: u.id,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      await Notification.bulkCreate(notificationRecords);

      // 2. Send FCM push — exclude creator (self-notification block)
      const tokens = users
        .filter(u => u.id !== creatorUserId)
        .map((u) => u.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error in sendToAll:", error);
    }
  },

  /**
   * Send notification strictly to Administrative staff (Admin, Superadmin)
   * excludeUserId: complaint pathavnarya student la exclude kara
   */
  async sendToAdmins(clientId: string, title: string, body: string, data?: any, excludeUserId?: string) {
    try {
      const admins = await User.findAll({
        where: { 
          client_id: clientId,
          role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] }
        },
        attributes: ["id", "fcm_token"],
      });

      if (admins.length === 0) return;

      const notificationRecords = admins.map((u) => ({
        client_id: clientId,
        user_id: u.id,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      await Notification.bulkCreate(notificationRecords);

      const tokens = admins
        .filter(u => u.id !== excludeUserId)
        .map((u) => u.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error in sendToAdmins:", error);
    }
  },

  /**
   * Complaint aali tevha: Admin + Teacher dono la pathva
   * (student ne complaint keleli ahe, tyala exclude kara)
   */
  async sendToAdminsAndTeachers(clientId: string, title: string, body: string, data?: any, excludeUserId?: string) {
    try {
      const recipients = await User.findAll({
        where: { 
          client_id: clientId,
          role_name: { [Op.in]: ['admin', 'superadmin', 'system admin', 'teacher'] }
        },
        attributes: ["id", "fcm_token"],
      });

      if (recipients.length === 0) return;

      const notificationRecords = recipients.map((u) => ({
        client_id: clientId,
        user_id: u.id,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      await Notification.bulkCreate(notificationRecords);

      const tokens = recipients
        .filter(u => u.id !== excludeUserId)
        .map((u) => u.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error in sendToAdminsAndTeachers:", error);
    }
  },

  /**
   * Super Admin la notification pathva (school add / admin add)
   * client_id naste — superadmin global asato
   */
  async sendToSuperAdmins(title: string, body: string, data?: any) {
    try {
      const superAdmins = await User.findAll({
        where: { role_name: { [Op.in]: ['superadmin', 'system admin'] } },
        attributes: ["id", "fcm_token", "client_id"],
      });

      if (superAdmins.length === 0) return;

      const notificationRecords = superAdmins.map((u) => ({
        client_id: u.client_id || undefined,
        user_id: u.id,
        title,
        body,
        type: data?.type || 'general',
        data: data || {},
      }));
      await Notification.bulkCreate(notificationRecords);

      const tokens = superAdmins
        .map((u) => u.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error in sendToSuperAdmins:", error);
    }
  }
};
