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
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error(`[NotificationService] sendToUser: Invalid userId=${userId}`);
        return;
      }

      console.log(`[NotificationService] sendToUser: userId=${userId}, title=${title}`);

      // Sanitize data - all values must be strings for FCM
      const sanitizedData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      ) : {};

      // 1. Save to Database for history
      const notif = await Notification.create({
        user_id: userId,
        title,
        body,
        type: sanitizedData.type || 'general',
        data: sanitizedData,
      });
      console.log(`[NotificationService] Saved to DB: id=${notif.id}, user_id=${userId}`);

      // 2. Send FCM
      const user = await User.findByPk(userId);
      if (!user?.fcm_token) {
        console.log(`[NotificationService] No FCM token for user ${userId}. Saved to history only.`);
        return;
      }

      await admin.messaging().send({
        notification: { title, body },
        token: user.fcm_token,
        data: sanitizedData,
      });
      console.log(`[NotificationService] FCM sent to user ${userId}`);
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
      const sanitizedData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      ) : {};

      const getDigits = (s: string) => s.toString().replace(/\D/g, '');
      const digits = getDigits(standard);
      
      const standardVariations = [standard.trim(), standard.trim().toLowerCase(), standard.trim().toUpperCase()];
      if (digits && digits !== standard) {
        standardVariations.push(digits, `${digits}th`, `${digits}st`, `${digits}nd`, `${digits}rd`);
        standardVariations.push(`${digits}TH`, `${digits}ST`, `${digits}ND`, `${digits}RD`);
      }

      console.log(`[sendToClass] standard="${standard}" client=${clientId} creator=${creatorUserId || 'N/A'}`);

      let students = await Student.findAll({
        where: { 
          client_id: clientId, 
          standard: { [Op.or]: standardVariations.map(v => ({ [Op.iLike]: v })) } 
        },
        include: [{ model: User, as: "user", attributes: ['id', 'fcm_token'] }],
      });

      if (students.length === 0 && digits) {
        students = await Student.findAll({
          where: { client_id: clientId, standard: { [Op.iLike]: `%${digits}%` } },
          include: [{ model: User, as: "user", attributes: ['id', 'fcm_token'] }],
        });
      }

      console.log(`[sendToClass] Found ${students.length} students for standard=${standard}`);
      if (students.length === 0) {
        console.warn(`[sendToClass] No students found! Check standard format. Tried: ${standardVariations.join(', ')}`);
        return;
      }

      const recipients = new Map<string, { fcm_token: string | null }>();

      for (const s of students as any[]) {
        const uid = s.user?.id || s.user_id;
        const token = s.user?.fcm_token || null;
        if (uid) recipients.set(uid, { fcm_token: token });
      }

      if (includeAdmins) {
        const adminUsers = await User.findAll({
          where: { client_id: clientId, role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] } },
          attributes: ['id', 'fcm_token'],
        });
        for (const a of adminUsers) {
          if (a.id) recipients.set(a.id as string, { fcm_token: a.fcm_token || null });
        }
      }

      console.log(`[sendToClass] Total recipients: ${recipients.size}`);

      // Save to DB (exclude creator — teacher la swatahla notification nako)
      const dbRecipients = Array.from(recipients.keys()).filter(uid => uid !== creatorUserId);
      if (dbRecipients.length > 0) {
        await Notification.bulkCreate(
          dbRecipients.map(uid => ({
            client_id: clientId,
            user_id: uid,
            title,
            body,
            type: sanitizedData.type || 'general',
            data: sanitizedData,
          }))
        );
        console.log(`[sendToClass] Saved ${dbRecipients.length} notifications to DB`);
      }

      // Send FCM
      const pushTokens = Array.from(recipients.entries())
        .filter(([uid]) => uid !== creatorUserId)
        .map(([_, info]) => info.fcm_token)
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

      if (pushTokens.length === 0) {
        console.log(`[sendToClass] No FCM tokens to push`);
        return;
      }

      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        tokens: pushTokens,
        data: sanitizedData,
      });
      console.log(`[sendToClass] FCM: ${response.successCount} success, ${response.failureCount} failure`);
    } catch (error) {
      console.error("[sendToClass] Error:", error);
    }
  },


  /**
   * Send school-wide notification (to all users of a client)
   */
  // targetRole: 'all' | 'student' | 'teacher' | 'admin' — filters who receives the notification
  async sendToAll(clientId: string, title: string, body: string, data?: any, creatorUserId?: string, targetRole: string = 'all') {
    try {
      const sanitizedData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      ) : {};

      const whereClause: any = { client_id: clientId };
      if (targetRole && targetRole !== 'all') whereClause.role_name = targetRole;

      const users = await User.findAll({ where: whereClause, attributes: ["id", "fcm_token"] });
      if (users.length === 0) return;

      // Exclude creator from DB record too
      const dbUsers = users.filter(u => u.id !== creatorUserId);
      if (dbUsers.length > 0) {
        await Notification.bulkCreate(dbUsers.map(u => ({
          client_id: clientId, user_id: u.id, title, body,
          type: sanitizedData.type || 'general', data: sanitizedData,
        })));
      }

      const tokens = users
        .filter(u => u.id !== creatorUserId)
        .map(u => u.fcm_token)
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

      if (tokens.length === 0) return;
      await admin.messaging().sendEachForMulticast({ notification: { title, body }, tokens, data: sanitizedData });
    } catch (error) {
      console.error("[sendToAll] Error:", error);
    }
  },

  /**
   * Send notification strictly to Administrative staff (Admin, Superadmin)
   * excludeUserId: complaint pathavnarya student la exclude kara
   */
  async sendToAdmins(clientId: string, title: string, body: string, data?: any, excludeUserId?: string) {
    try {
      const sanitizedData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      ) : {};

      const admins = await User.findAll({
        where: { client_id: clientId, role_name: { [Op.in]: ['admin', 'superadmin', 'system admin'] } },
        attributes: ["id", "fcm_token"],
      });
      if (admins.length === 0) return;

      const dbAdmins = admins.filter(u => u.id !== excludeUserId);
      if (dbAdmins.length > 0) {
        await Notification.bulkCreate(dbAdmins.map(u => ({
          client_id: clientId, user_id: u.id, title, body,
          type: sanitizedData.type || 'general', data: sanitizedData,
        })));
      }

      const tokens = dbAdmins
        .map(u => u.fcm_token)
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

      if (tokens.length === 0) return;
      await admin.messaging().sendEachForMulticast({ notification: { title, body }, tokens, data: sanitizedData });
    } catch (error) {
      console.error("[sendToAdmins] Error:", error);
    }
  },

  /**
   * Complaint aali tevha: Admin + Teacher dono la pathva
   * (student ne complaint keleli ahe, tyala exclude kara)
   */
  async sendToAdminsAndTeachers(clientId: string, title: string, body: string, data?: any, excludeUserId?: string) {
    try {
      const sanitizedData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      ) : {};

      const recipients = await User.findAll({
        where: { 
          client_id: clientId,
          role_name: { [Op.in]: ['admin', 'superadmin', 'system admin', 'teacher'] }
        },
        attributes: ["id", "fcm_token"],
      });

      if (recipients.length === 0) return;

      const dbRecipients = recipients.filter(u => u.id !== excludeUserId);
      if (dbRecipients.length > 0) {
        await Notification.bulkCreate(dbRecipients.map((u) => ({
          client_id: clientId,
          user_id: u.id,
          title,
          body,
          type: sanitizedData.type || 'general',
          data: sanitizedData,
        })));
      }

      const tokens = dbRecipients
        .map((u) => u.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens,
        data: sanitizedData,
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
      const sanitizedData = data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
      ) : {};

      const superAdmins = await User.findAll({
        where: { role_name: { [Op.in]: ['superadmin', 'system admin'] } },
        attributes: ["id", "fcm_token", "client_id"],
      });

      if (superAdmins.length === 0) return;

      await Notification.bulkCreate(superAdmins.map((u) => ({
        client_id: u.client_id || undefined,
        user_id: u.id,
        title,
        body,
        type: sanitizedData.type || 'general',
        data: sanitizedData,
      })));

      const tokens = superAdmins
        .map((u) => u.fcm_token)
        .filter((t) => typeof t === 'string' && t.trim() !== "") as string[];

      if (tokens.length === 0) return;

      await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        tokens,
        data: sanitizedData,
      });
    } catch (error) {
      console.error("Error in sendToSuperAdmins:", error);
    }
  }
};
