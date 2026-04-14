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
   * Send notification to all students of a specific class in a school (client)
   */
  async sendToClass(clientId: string, standard: string, title: string, body: string, data?: any) {
    try {
      // 1. Precise Match with Variations
      const getDigits = (s: string) => s.toString().replace(/\D/g, '');
      const digits = getDigits(standard);
      
      const standardVariations = [standard.trim(), standard.trim().toLowerCase(), standard.trim().toUpperCase()];
      if (digits && digits !== standard) {
        standardVariations.push(digits);
        standardVariations.push(`${digits}th`);
        standardVariations.push(`${digits}ST`);
        standardVariations.push(`${digits}ND`);
        standardVariations.push(`${digits}RD`);
        standardVariations.push(`${digits}st`);
        standardVariations.push(`${digits}nd`);
        standardVariations.push(`${digits}rd`);
        standardVariations.push(`${digits}TH`);
      }

      console.log(`[NotificationService] Delivering for Standard: "${standard}" (Variations: ${[...new Set(standardVariations)].join(', ')}) for Client: ${clientId}`);

      // Find all students in this class - Use Op.iLike for case-insensitivity and trim for safety
      let students = await Student.findAll({
        where: { 
          client_id: clientId, 
          standard: { [Op.or]: standardVariations.map(v => ({ [Op.iLike]: v })) } 
        },
        include: [{ model: User, as: "user" }],
      });

      // 2. Broad Fallback: If no students found, try simple digit matching
      if (students.length === 0 && digits) {
        console.log(`[NotificationService] No precise match found for "${standard}". Trying broad fallback with digits: "${digits}"`);
        students = await Student.findAll({
          where: { 
            client_id: clientId, 
            standard: { [Op.iLike]: `%${digits}%` } 
          },
          include: [{ model: User, as: "user" }],
        });
      }

      console.log(`[NotificationService] Final match count: ${students.length} students found.`);
      
      if (students.length === 0) {
        // Diagnostic: Log a few students from this client to see their standard format
        const sampleStudents = await Student.findAll({ where: { client_id: clientId }, limit: 5 });
        const existingStandards = sampleStudents.map(s => s.get('standard')).join(', ');
        console.warn(`[NotificationService] [DIAGNOSTIC] Client ${clientId} has students with standards: [${existingStandards}]`);
      }

      // 1. Multi-save to Database
      const notificationRecords = students.map((s: any) => {
        const studentUserId = s.user?.id || s.user_id;
        console.log(`[NotificationService] Preparing record for user: ${studentUserId} (Role: ${s.user?.role_name || 'unknown'})`);
        return {
          client_id: clientId,
          user_id: studentUserId,
          title,
          body,
          type: data?.type || 'general',
          data: data || {},
        };
      });
      
      if (notificationRecords.length > 0) {
        await Notification.bulkCreate(notificationRecords);
        console.log(`[NotificationService] Successfully saved ${notificationRecords.length} records to history.`);
      }

      // 2. Prepare FCM tokens
      const tokens = students
        .map((s: any) => s.user?.fcm_token)
        .filter((t) => t != null);

      if (tokens.length === 0) {
        console.log(`[NotificationService] No FCM tokens found for class ${standard}. Saved to history only.`);
        return;
      }

      console.log(`[NotificationService] Sending FCM to class ${standard} (${tokens.length} tokens).`);

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens: tokens,
        data: data || {},
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[NotificationService] Multicast result: ${response.successCount} success, ${response.failureCount} failure.`);
    } catch (error) {
      console.error("[NotificationService] Error in sendToClass:", error);
    }
  },

  /**
   * Send school-wide notification (to all users of a client)
   */
  async sendToAll(clientId: string, title: string, body: string, data?: any) {
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

      // 2. Filter tokens
      const tokens = users.map((u) => u.fcm_token).filter((t) => t != null) as string[];

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
  }
};
