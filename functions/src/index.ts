import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const sendChatNotification = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, _context) => {
    try {
      const message = snapshot.data();
      const recipientId = message.recipientId;

      // Retrieve the recipient’s FCM token from Firestore
      const recipientDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get();
      const fcmToken = recipientDoc.data()?.fcmToken;

      if (fcmToken) {
        // Construct the notification payload
        const payload = {
          notification: {
            title: `New message from ${message.senderName}`,
            body: message.content,
          },
        };

        // Send the notification
        await admin.messaging().sendToDevice(fcmToken, payload);
      }
    } catch (error) {
      console.error("Error sending chat notification:", error);
    }
  });

export const sendForumNotification = functions.firestore
  .document("posts/{postId}")
  .onCreate(async (snapshot, _context) => {
    try {
      const post = snapshot.data();
      const userTokensSnapshot = await admin
        .firestore()
        .collection("users")
        .get();

      const tokens: string[] = [];
      userTokensSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });

      if (tokens.length > 0) {
        // Construct the notification payload
        const payload = {
          notification: {
            title: "New Forum Post",
            body: `${post.authorName} posted: ${post.content}`,
          },
        };

        // Send the notification to all tokens
        await admin.messaging().sendToDevice(tokens, payload);
      }
    } catch (error) {
      console.error("Error sending forum notification:", error);
    }
  });
