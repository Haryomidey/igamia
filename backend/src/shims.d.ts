declare module '@nestjs/websockets' {
  export function WebSocketGateway(...args: any[]): ClassDecorator;
  export function WebSocketServer(): PropertyDecorator;
  export function SubscribeMessage(...args: any[]): MethodDecorator;
  export function ConnectedSocket(): ParameterDecorator;
  export function MessageBody(): ParameterDecorator;

  export interface OnGatewayConnection {
    handleConnection?(client: any): any;
  }

  export interface OnGatewayDisconnect {
    handleDisconnect?(client: any): any;
  }
}

declare module 'socket.io' {
  export class Socket {
    data: any;
    handshake: any;
    join(room: string): Promise<void>;
    leave(room: string): Promise<void>;
    disconnect(close?: boolean): void;
  }

  export class Server {
    emit(event: string, payload?: any): void;
    to(room: string): Server;
  }
}
