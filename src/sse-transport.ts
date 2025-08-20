export interface Message {
  id?: string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export interface ServerTransport {
  send(message: Message): Promise<void>;
  close(): Promise<void>;
  onMessage(handler: (message: Message) => void): void;
  onClose(handler: () => void): void;
}

export class SSETransport implements ServerTransport {
  private messageHandlers: ((message: Message) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  private messageQueue: Message[] = [];
  private isConnected = false;

  constructor() {}

  async send(message: Message): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Transport não está conectado');
    }

    this.messageQueue.push(message);
    this.messageHandlers.forEach(handler => handler(message));
  }

  async close(): Promise<void> {
    this.isConnected = false;
    this.closeHandlers.forEach(handler => handler());
  }

  onMessage(handler: (message: Message) => void): void {
    this.messageHandlers.push(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  getMessageQueue(): Message[] {
    return [...this.messageQueue];
  }

  clearMessageQueue(): void {
    this.messageQueue = [];
  }
}
