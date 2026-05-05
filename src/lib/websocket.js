import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;

export const connectWebSocket = (onConnect) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  client = new Client({
    webSocketFactory: () => new SockJS(`${apiUrl}/ws`),
    reconnectDelay: 5000,
    onConnect: () => {
      if (onConnect) onConnect(client);
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
    },
  });

  client.activate();
  return client;
};

export const disconnectWebSocket = () => {
  if (client && client.active) {
    client.deactivate();
    client = null;
  }
};

export const subscribeToDelivery = (stompClient, deliveryId, callback) => {
  if (!stompClient || !stompClient.connected) return null;
  return stompClient.subscribe(
    `/topic/delivery/${deliveryId}`,
    (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch {}
    }
  );
};

export const subscribeToUserNotifications = (stompClient, email, callback) => {
  if (!stompClient || !stompClient.connected) return null;
  const topic = email.replace("@", "-").replace(".", "-");
  return stompClient.subscribe(
    `/topic/user/${topic}`,
    (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch {}
    }
  );
};