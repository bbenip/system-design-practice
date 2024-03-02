import http from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { User, uuid } from './types';

const DEFAULT_PORT = 8001;

export class Server {
  private connections = new Map<string, WebSocket>();
  private users = new Map<string, User>();

  constructor() {}

  private getUserById = (userId: uuid) => {
    const user = this.users.get(userId);

    return user;
  };

  private getConnectionByUserId = (userId: uuid) => {
    const connection = this.connections.get(userId);

    return connection;
  };

  private removeUserById = (userId: uuid) => {
    this.connections.delete(userId);
    this.users.delete(userId);
  };

  private handleMessage = (bytes: RawData, userId: uuid) => {
    const messageString = bytes.toString();
    const message = JSON.parse(messageString);

    const user = this.getUserById(userId);

    console.log(`user sent message: ${messageString}`);
    this.sendMessage(userId);
  };

  private sendMessage = (userId: uuid) => {
    const connection = this.getConnectionByUserId(userId)!;

    connection.send(JSON.stringify({ text: 'Good morning' }));
  };

  private handleClose = (userId: uuid) => {
    console.log(`${userId} disconnected`);

    this.removeUserById(userId);
  };

  public initializeServer = (port: number = DEFAULT_PORT) => {
    const server = http.createServer();

    const websocketServer = new WebSocketServer({ server });

    websocketServer.on('connection', connection => {
      const userId = uuidv4();
      console.log(`User: ${userId} connected`);

      this.connections.set(userId, connection);
      this.users.set(userId, { userId });

      connection.on('message', message => this.handleMessage(message, userId));
      connection.on('close', () => this.handleClose(userId));
    });

    server.listen(port, () => {
      console.log(`Websocket is now running on port ${port}`);
    });
  };
}
