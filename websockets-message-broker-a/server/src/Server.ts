import http from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Message, User, uuid } from './types';
import { KAFKA_PORT, KAFKA_TOPIC, SERVER_PORT } from './constants/environment';
const { Kafka } = require('kafkajs');

export class Server {
  private connections = new Map<string, WebSocket>();
  private users = new Map<string, User>();
  private kafka = new Kafka({
    clientId: 'server',
    brokers: [`kafka:${KAFKA_PORT}`]
  });
  private producer;
  private consumer;

  constructor() {
    this.consumer = this.kafka.consumer({ groupId: KAFKA_TOPIC });
    this.producer = this.kafka.producer();
  }

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

  private handleMessage = async (bytes: RawData, userId: uuid) => {
    const messageString = bytes.toString();
    const { text }: Message = JSON.parse(messageString);

    const user = this.getUserById(userId);

    console.log(`user sent message: ${messageString}`);
    await this.producer.send({
      topic: KAFKA_TOPIC,
      messages: [{ value: text }],
    });
  };

  private handleClose = async (userId: uuid) => {
    console.log(`${userId} disconnected`);

    this.removeUserById(userId);
    await this.producer.disconnect();
  };

  private sendMessageToClient = (userId: uuid, message: string) => {
    const connection = this.getConnectionByUserId(userId)!;

    connection.send(JSON.stringify({ text: message }));
  };

  public initializeServer = (port: number = Number(SERVER_PORT)) => {
    const server = http.createServer();

    const websocketServer = new WebSocketServer({ server });

    console.log('Connection to Kafka producer');
    await this.producer.connect();

    console.log('Connecting to Kafka consumer');
    await this.consumer.connect();
    
    console.log('Subscribing to kafka topic');
    await this.consumer.subscribe({ topic: KAFKA_TOPIC });
    
    websocketServer.on('connection', async (connection) => {
      const userId = uuidv4();
      console.log(`User: ${userId} connected`);
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: any) => {
          console.log('Kafka message received:', message.value.toString());
          await this.sendMessageToClient(userId, message.value.toString());
        },
      });

      this.connections.set(userId, connection);
      this.users.set(userId, { userId });

      connection.on('message', async (message) => await this.handleMessage(message, userId));
      connection.on('close', async () => await this.handleClose(userId));

    });

    server.listen(port, () => {
      console.log(`Websocket is now running on port ${port}`);
    });
  };
}
