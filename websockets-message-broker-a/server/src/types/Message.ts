import { MessageType } from './MessageType';
import { uuid } from './uuid';

interface BaseMessage {
  messageType: MessageType;
  roomId: uuid;
}

export interface SendMessage extends BaseMessage {
  message: string;
  messageType: MessageType.SEND;
}

export interface ConnectMessage extends BaseMessage {
  messageType: MessageType.CONNECT;
}

export type Message = SendMessage | ConnectMessage;
