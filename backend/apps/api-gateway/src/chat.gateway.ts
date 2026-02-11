import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@app/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client trying to connect: ${client.id}`);
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn(`Client ${client.id} has no token, disconnecting`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Link socket to user room
      await client.join(`user:${userId}`);
    } catch (error) {
      this.logger.error(
        `Token validation failed for client ${client.id}`,
        error,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Cleanup userSockets map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  sendMessageNotification(recipientId: string, message: any) {
    this.logger.log(`Sending notification to user ${recipientId}`);
    this.server.to(`user:${recipientId}`).emit('message.new', message);
  }

  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    return undefined;
  }
}
