import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../modules/auth/token.utils';
import { SOCKET_EVENTS, UserRole } from '../config/constants';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { IAlert } from '../modules/alerts/alert.model';

/**
 * Socket.IO Service
 * Handles real-time communication for alerts and notifications
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.socket.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Socket.IO server initialized');

    return this.io;
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = verifyAccessToken(token);
        socket.userId = payload.userId;
        socket.userRole = payload.role;

        next();
      } catch (error) {
        logger.error('Socket authentication failed', error);
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const userRole = socket.userRole!;

      logger.info(`Socket connected: ${socket.id} for user ${userId}`);

      // Track user's socket connections
      this.addUserSocket(userId, socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join role-specific room
      socket.join(`role:${userRole}`);

      // Send authentication confirmation
      socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
        userId,
        role: userRole,
      });

      // Handle disconnection
      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        this.removeUserSocket(userId, socket.id);
      });

      // Handle custom events
      this.setupCustomEventHandlers(socket);
    });
  }

  /**
   * Setup custom event handlers for each socket
   */
  private setupCustomEventHandlers(socket: AuthenticatedSocket): void {
    // Acknowledge alert receipt
    socket.on('alert:received', (data: { alertId: string }) => {
      logger.info(`Alert ${data.alertId} received by user ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  }

  /**
   * Add user socket to tracking map
   */
  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Remove user socket from tracking map
   */
  private removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Notify parent of new alert
   */
  notifyParent(parentId: string, alert: IAlert): void {
    if (!this.io) return;

    const eventData = {
      alertId: alert._id.toString(),
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      childId: alert.childId.toString(),
      timestamp: new Date().toISOString(),
    };

    // Emit to parent's room
    this.io.to(`user:${parentId}`).emit(SOCKET_EVENTS.CHILD_ALERT, eventData);

    // For high severity, also emit specific event
    if (alert.severity === 'high' || alert.severity === 'critical') {
      this.io.to(`user:${parentId}`).emit(SOCKET_EVENTS.HIGH_SEVERITY_ALERT, eventData);
    }

    logger.info(`Alert notification sent to parent ${parentId}`);
  }

  /**
   * Notify child of alert/guidance
   */
  notifyChild(childId: string, alert: IAlert): void {
    if (!this.io) return;

    const eventData = {
      alertId: alert._id.toString(),
      title: alert.title,
      guidance: alert.guidanceProvided,
      severity: alert.severity,
      resources: alert.resourcesShared,
      timestamp: new Date().toISOString(),
    };

    this.io.to(`user:${childId}`).emit(SOCKET_EVENTS.NEW_ALERT, eventData);

    logger.info(`Alert guidance sent to child ${childId}`);
  }

  /**
   * Emit scan result to user
   */
  emitScanResult(userId: string, scanResult: Record<string, unknown>): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(SOCKET_EVENTS.SCAN_RESULT, scanResult);
  }

  /**
   * Emit to specific user
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected clients (admin use)
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) return;

    this.io.emit(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
export default socketService;
