import * as admin from "firebase-admin";
import path from "path";
import { User, Student } from "../models";

// Initialize Firebase Admin
const serviceAccount = require("../config/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
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
