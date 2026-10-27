import { CONFIG } from '../config/env';

class ChatSocketManager {
  constructor() {
    this.socket = null;
    this.pingTimer = null;
    this.reconnectTimer = null;
    this.listeners = new Set();
    this.seenMessageIds = new Set();
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (CONFIG.IS_MOCK) {
      console.log('[MOCK WebSocket] Simulación de chat conectada');
      this.isConnected = true;
      this.notifyStatus(true);
      return;
    }

    // Convertir http/https a ws/wss
    const wsBase = CONFIG.API_BASE.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/api/ws?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[Chat WebSocket] Conectado exitosamente');
        this.isConnected = true;
        this.notifyStatus(true);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'pong') {
            return;
          }

          if (payload.type === 'message' && payload.data) {
            const msg = payload.data;
            // Descartar duplicados según contrato
            if (msg.id && this.seenMessageIds.has(msg.id)) {
              return;
            }
            if (msg.id) {
              this.seenMessageIds.add(msg.id);
            }
            this.notifyListeners(msg);
          }
        } catch (err) {
          console.error('[Chat WebSocket] Error al procesar mensaje:', err);
        }
      };

      this.socket.onclose = (event) => {
        console.warn('[Chat WebSocket] Conexión cerrada:', event.code, event.reason);
        this.isConnected = false;
        this.notifyStatus(false);
        this.stopHeartbeat();
        // Intentar reconectar automáticamente en caso de failover del balanceador
        this.scheduleReconnect(token);
      };

      this.socket.onerror = (err) => {
        console.error('[Chat WebSocket] Error en conexión:', err);
      };
    } catch (err) {
      console.error('[Chat WebSocket] Fallo al crear WebSocket:', err);
      this.scheduleReconnect(token);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    // Ping cada 30 segundos según contrato (el ALB desconecta tras 60 s de inactividad)
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  scheduleReconnect(token) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('[Chat WebSocket] Intentando reconectar...');
      this.connect(token);
    }, 4000);
  }

  sendMessage(toUserId, text, currentUserId) {
    const payload = {
      type: 'message',
      data: { toUserId: Number(toUserId), text }
    };

    if (CONFIG.IS_MOCK) {
      const mockMsg = {
        id: Date.now(),
        fromUserId: currentUserId || 3,
        toUserId: Number(toUserId),
        text,
        createdAt: new Date().toISOString()
      };
      this.seenMessageIds.add(mockMsg.id);
      this.notifyListeners(mockMsg);

      // Simular respuesta automática del amigo en mock tras 1.5s
      setTimeout(() => {
        const replyMsg = {
          id: Date.now() + 1,
          fromUserId: Number(toUserId),
          toUserId: currentUserId || 3,
          text: `Recibido: "${text}". ¡Mucho éxito con el proyecto!`,
          createdAt: new Date().toISOString()
        };
        this.seenMessageIds.add(replyMsg.id);
        this.notifyListeners(replyMsg);
      }, 1500);

      return true;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(message) {
    this.listeners.forEach(cb => cb(message));
  }

  notifyStatus(connected) {
    // Evento interno opcional
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const chatSocket = new ChatSocketManager();
