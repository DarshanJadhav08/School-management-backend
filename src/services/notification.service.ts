import * as admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { User, Student } from "../models";

// Load configuration from Environment Variable (Render) or Local File
let serviceAccount: any = null;

try {
  if (process.env.FIREBASE_CONFIG) {
    // If running on Render, use the environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
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
    let privateKey = serviceAccount.private_key;
    if (typeof privateKey === 'string') {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        private_key: privateKey,
      }),
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
      const user = await User.findByPk(userId);
      if (!user || !user.fcm_token) {
        console.log(`User ${userId} has no FCM token. Skipping notification.`);
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
      console.error(`Error sending message to user ${userId}:`, error);
    }
  },

  /**
   * Send notification to all students of a specific class in a school (client)
   */
  async sendToClass(clientId: string, standard: string, title: string, body: string, data?: any) {
    try {
      // Find all students in this class
      const students = await Student.findAll({
        where: { client_id: clientId, standard: standard },
        include: [{ model: User, as: "user", attributes: ["id", "fcm_token"] }],
      });

      const tokens = students
        .map((s: any) => s.user?.fcm_token)
        .filter((t) => t != null);

      if (tokens.length === 0) {
        console.log(`No FCM tokens found for class ${standard} in client ${clientId}`);
        return;
      }

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens: tokens,
        data: data || {},
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent multicast message to ${response.successCount} devices.`);
    } catch (error) {
      console.error("Error sending multicast message:", error);
    }
  },

  /**
   * Send school-wide notification (to all users of a client)
   */
  async sendToAll(clientId: string, title: string, body: string, data?: any) {
    try {
      const users = await User.findAll({
        where: { client_id: clientId },
        attributes: ["fcm_token"],
      });

      const tokens = users.map((u) => u.fcm_token).filter((t) => t != null) as string[];

      if (tokens.length === 0) return;

      const message: admin.messaging.MulticastMessage = {
        notification: { title, body },
        tokens: tokens,
        data: data || {},
      };

      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Error sending school-wide notification:", error);
    }
  }
};
