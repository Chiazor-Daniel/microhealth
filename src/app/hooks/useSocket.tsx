import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "../services/api";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

let globalSocket: Socket | null = null;

export function getSocket(): Socket | null {
  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (!globalSocket?.connected) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
    }

    socketRef.current = globalSocket;

    globalSocket.on("connect", () => {
      console.log("[ws] connected");
    });

    globalSocket.on("disconnect", () => {
      console.log("[ws] disconnected");
    });

    return () => {
    };
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, on, emit };
}
