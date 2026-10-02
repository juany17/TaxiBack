import { Inject, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TripEntity } from './entities/trip.entity';
import { TripsService } from './trips.service';

interface SocketUser {
  id: string;
  rol: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? ['http://localhost:4200'],
  },
})
export class TripsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TripsService))
    private readonly tripsService: TripsService,
  ) {}

  /**
   * Exige un JWT válido en el handshake. Un socket sin token se desconecta
   * de inmediato, así nunca llega a recibir eventos de viajes.
   */
  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      console.warn(`[WebSocket] Conexión rechazada (sin token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as { sub?: unknown; rol?: unknown };
      if (typeof payload.sub !== 'string') {
        throw new Error('Token sin subject');
      }
      (client.data as { user?: SocketUser }).user = {
        id: payload.sub,
        rol: typeof payload.rol === 'string' ? payload.rol : '',
      };
      console.log(`[WebSocket] Cliente conectado: ${client.id} (${payload.rol})`);
    } catch {
      console.warn(`[WebSocket] Conexión rechazada (token inválido): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Cliente desconectado: ${client.id}`);
  }

  /**
   * Une al cliente a la sala de un viaje, pero solo si participa en él
   * (o es administrador). Esto cierra la fuga de datos entre viajes ajenos.
   */
  @SubscribeMessage('joinTrip')
  async handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId?: string },
  ) {
    const user = (client.data as { user?: SocketUser }).user;
    if (!user) {
      return { event: 'error', message: 'Conexión no autenticada' };
    }
    if (!data?.tripId) {
      return { event: 'error', message: 'tripId es obligatorio' };
    }

    try {
      await this.tripsService.findByIdForUser(data.tripId, {
        id: user.id,
        rol: user.rol as never,
      });
    } catch {
      console.warn(`[WebSocket] ${user.id} intentó unirse a la sala ajena trip_${data.tripId}`);
      return { event: 'error', message: 'No tienes acceso a este viaje' };
    }

    const room = `trip_${data.tripId}`;
    client.join(room);
    console.log(`[WebSocket] Cliente ${client.id} se unió a la sala ${room}`);
    return { event: 'joinedRoom', room };
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake?.auth as { token?: unknown } | undefined;
    if (typeof auth?.token === 'string' && auth.token.trim()) {
      return auth.token.trim();
    }
    const header = client.handshake?.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.substring(7).trim() || null;
    }
    return null;
  }

  notifyTripCreated(trip: TripEntity) {
    console.log(`[WebSocket] Notificando nuevo viaje pendiente: ${trip.id}`);
    this.server.emit('newTripAvailable', trip);
  }

  notifyTripAccepted(trip: TripEntity) {
    console.log(`[WebSocket] Notificando viaje aceptado: ${trip.id}`);
    const room = `trip_${trip.id}`;
    this.server.to(room).emit('tripStatusChanged', trip);
    this.server.emit('tripUpdated', trip);
  }

  notifyTripCompleted(trip: TripEntity) {
    console.log(`[WebSocket] Notificando viaje finalizado: ${trip.id}`);
    const room = `trip_${trip.id}`;
    this.server.to(room).emit('tripStatusChanged', trip);
    this.server.emit('tripUpdated', trip);
  }
}
