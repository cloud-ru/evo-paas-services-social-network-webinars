import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PostResponseDto } from '@app/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PostGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PostGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastPost(post: PostResponseDto) {
    this.logger.log(`Broadcasting post ${post.id} to all clients`);
    this.server.emit('post.created', post);
  }
}
