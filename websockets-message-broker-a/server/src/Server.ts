import http from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  ConnectMessage,
  Message,
  MessageType,
  SendMessage,
  User,
  uuid,
} from './types';
import { KAFKA_PORT, KAFKA_TOPIC, SERVER_PORT } from './constants/environment';
const { Kafka } = require('kafkajs');

export class Server {
  private connections = new Map<string, WebSocket>();
  private users = new Map<string, User>();
  private rooms = new Map<string, Map<uuid, User>>();
  private kafka = new Kafka({
    clientId: 'server',
    brokers: [`kafka:${KAFKA_PORT}`],
  });
  private producer;
  private consumer;

  constructor() {
    this.consumer = this.kafka.consumer({ groupId: KAFKA_TOPIC });
    this.producer = this.kafka.producer();
  }

  private routeMessage = ({
    userId,
    message,
  }: {
    userId: uuid;
    message: Message;
  }) => {
    switch (message.messageType) {
      case MessageType.SEND: {
        this.sendMessageToClient({ message, userId });
        break;
      }
      case MessageType.CONNECT: {
        this.connectToRoom({ message, userId });
        break;
      }
      default:
        throw new Error('Error parsing message type');
    }
  };

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

  private getRoomById = (roomId: uuid) => {
    const room = this.rooms.get(roomId);

    if (!room) {
      const newRoom = new Map<uuid, User>();
      this.rooms.set(roomId, newRoom);

      return newRoom;
    }

    return room;
  };

  private handleKafkaMessage = async (bytes: RawData, userId: uuid) => {
    const message = bytes.toString();

    console.log(`user sent message: ${message}`);
    await this.producer.send({
      topic: KAFKA_TOPIC,
      messages: [{ value: message }],
    });
  };

  private handleClose = (userId: uuid) => {
    this.removeUserById(userId);
    console.log(`${userId} disconnected`);
  };

  private connectToRoom = ({
    message: { roomId },
    userId,
  }: {
    message: ConnectMessage;
    userId: uuid;
  }) => {
    const room = this.getRoomById(roomId);
    const user = this.getUserById(userId)!;

    room.set(userId, user);
    console.log(`connected user: ${userId} to room ${roomId}`);
  };

  private sendMessageToClient = ({
    message: { message, roomId },
    userId,
  }: {
    message: SendMessage;
    userId: uuid;
  }) => {
    const room = this.getRoomById(roomId);

    room.forEach((_, receiver: uuid) => {
      const connection = this.getConnectionByUserId(receiver)!;
      connection.send(JSON.stringify({ userId, message }));
    });
  };

  public initializeServer = async (port: number = Number(SERVER_PORT)) => {
    const server = http.createServer();

    const websocketServer = new WebSocketServer({ server });

    console.log('Connecting to Kafka producer');
    await this.producer.connect();

    console.log('Connecting to Kafka consumer');
    await this.consumer.connect();

    console.log('Subscribing to kafka topic');
    await this.consumer.subscribe({ topic: KAFKA_TOPIC });

    websocketServer.on('connection', async (connection) => {
      const userId = uuidv4();
      console.log(`User: ${userId} connected`);

      await this.consumer.run({
        eachMessage: async ({ message: kafkaMessage }: any) => {
          const messageString = kafkaMessage.value.toString();
          const message: Message = JSON.parse(messageString);
          console.log('Kafka message received:', message);

          this.routeMessage({ userId, message });
        },
      });

      this.connections.set(userId, connection);
      this.users.set(userId, { userId });

      connection.on(
        'message',
        async (message) => await this.handleKafkaMessage(message, userId),
      );
      connection.on('close', async () => await this.handleClose(userId));
    });

    websocketServer.on('close', async () => {
      await this.consumer.disconnect();
      await this.producer.disconnect();
    });

    server.listen(port, () => {
      console.log(`Websocket is now running on port ${port}`);
    });
  };
}
