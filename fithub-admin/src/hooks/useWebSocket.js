import { useEffect, useRef, useState, useCallback } from "react";
import { getToken, getApiBaseUrl } from "../lib/api";

function getWsUrl() {
  const base = getApiBaseUrl();
  return base.replace(/^http/, "ws") + "/ws";
}

export default function useWebSocket({ onMessage }) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef(null);
  const pingInterval = useRef(null);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) return;

    const url = `${getWsUrl()}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
      // Keep alive ping every 30s
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong" || data.type === "connected") return;
        onMessageRef.current?.(data);
      } catch (e) {
        console.error("[WS] parse error:", e);
      }
    };

    ws.onclose = () => {
      clearInterval(pingInterval.current);
      if (mountedRef.current) {
        setConnected(false);
        reconnectTimeout.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, []);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimeout.current);
      clearInterval(pingInterval.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, sendMessage };
}
