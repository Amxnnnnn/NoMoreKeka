import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../secret.validator';
import { prismaClient } from '../index.validator';

/**
 * WebSocket Server for Real-time Features
 * 
 * Provides real-time notifications, updates, and communication
 * for the HRMS system.
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
  companyId?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'http://localhost:8080',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:5173',
          'http://localhost:3001',
        ],
        credentials: true,
        methods: ['GET', 'POST']
      },
      path: '/ws'
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Fetch user details
        const user = await prismaClient.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true, companyId: true, isActive: true }
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.role = user.role;
        socket.companyId = user.companyId;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 User ${socket.userId} connected via WebSocket`);
      
      // Store connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Join company room for company-wide notifications
        if (socket.companyId) {
          socket.join(`company:${socket.companyId}`);
        }
        
        // Join role-based rooms
        if (socket.role) {
          socket.join(`role:${socket.role}`);
        }
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.userId} disconnected`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle real-time notifications
      socket.on('subscribe:notifications', () => {
        if (socket.userId) {
          socket.join(`notifications:${socket.userId}`);
          console.log(`📢 User ${socket.userId} subscribed to notifications`);
        }
      });

      socket.on('unsubscribe:notifications', () => {
        if (socket.userId) {
          socket.leave(`notifications:${socket.userId}`);
          console.log(`📢 User ${socket.userId} unsubscribed from notifications`);
        }
      });

      // Handle work log updates
      socket.on('subscribe:worklog', () => {
        if (socket.userId) {
          socket.join(`worklog:${socket.userId}`);
          console.log(`⏰ User ${socket.userId} subscribed to work log updates`);
        }
      });

      // Handle project updates
      socket.on('subscribe:project', (projectId: string) => {
        if (socket.userId && projectId) {
          socket.join(`project:${projectId}`);
          console.log(`📋 User ${socket.userId} subscribed to project ${projectId} updates`);
        }
      });

      // Handle team updates
      socket.on('subscribe:team', (teamId: string) => {
        if (socket.userId && teamId) {
          socket.join(`team:${teamId}`);
          console.log(`👥 User ${socket.userId} subscribed to team ${teamId} updates`);
        }
      });
    });
  }

  // Public methods for sending notifications

  /**
   * Send notification to a specific user
   */
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Send notification to all users in a company
   */
  public sendToCompany(companyId: string, event: string, data: any) {
    this.io.to(`company:${companyId}`).emit(event, data);
  }

  /**
   * Send notification to users with specific role
   */
  public sendToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  /**
   * Send notification to project members
   */
  public sendToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  /**
   * Send notification to team members
   */
  public sendToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected users
   */
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

// Export singleton instance
let wsServer: WebSocketServer | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): WebSocketServer => {
  if (!wsServer) {
    wsServer = new WebSocketServer(httpServer);
    console.log('🔌 WebSocket server initialized');
  }
  return wsServer;
};

export const getWebSocketServer = (): WebSocketServer | null => {
  return wsServer;
};