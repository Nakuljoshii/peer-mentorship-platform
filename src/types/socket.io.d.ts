declare module 'socket.io' {
  export class Server {
    constructor(server: unknown, options?: unknown);
    use(handler: (socket: any, next: (error?: Error) => void) => void): void;
    on(event: string, handler: (socket: any) => void): void;
    to(room: string): { emit(event: string, ...args: unknown[]): void };
  }
}
