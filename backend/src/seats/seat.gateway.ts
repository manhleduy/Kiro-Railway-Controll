// src/realtime/seating.gateway.ts
import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // Configure to match your frontend URI boundary
})
export class SeatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(){
    this.server = new Server();
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected to live layout: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  /**
   * Internal method called by our database service wrapper
   * to broadcast real-time shifts immediately.
   */
  seatStatusUpdate(payload: { seat_id: string; old_state: string; new_state: string }) {
    const returnVal ={
        seatId: payload.seat_id,
        oldStatus: payload.old_state,
        newStatus: payload.new_state
    }
    this.server.emit('seatStatusChange', returnVal);
    
}
}