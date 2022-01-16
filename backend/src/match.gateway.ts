import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import Game from './models/game';
import Player from './models/player';

@WebSocketGateway(5000, { cors: { origin: '*' } })
export class MatchGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private logger: Logger = new Logger('MatchGateway');

  private unique: Set<Socket> = new Set();
  private queue: Socket[] = [];
  private games: Game[] = [];

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    let index: number = this.queue.indexOf(client);
    if (index > -1) {
      let removedElem = this.queue.splice(index, 1);
      this.logger.log(`Client removed from queue : ${removedElem[0].id}`);
      this.unique.delete(removedElem[0]);
    }
    let game = this.games.find((gm) => gm.hasSocket(client));
    this.handleMatchDisconnect(game, client);
  }

  handleMatchDisconnect(game: Game, client: Socket) {
    if (game) {
      game.handlePlayerDisconnect(client);
      game.stop();
    }
  }

  afterInit(server: any) {
    this.logger.log('Initialized');
  }

  @SubscribeMessage('up_paddle')
  handleUpPaddle(client: Socket, payload: any): void {
    let game = this.games.find((gm) => gm.hasSocket(client));
    if (game) {
      let player = game.getPlayerBySocket(client);
      if (payload === 'down') {
        player.getPaddle().up(true);
      } else if (payload === 'up') {
        player.getPaddle().up(false);
      }
    }
  }

  @SubscribeMessage('down_paddle')
  handleDownPaddle(client: Socket, payload: any): void {
    let game = this.games.find((gm) => gm.hasSocket(client));
    if (game) {
      let player = game.getPlayerBySocket(client);
      if (payload === 'down') {
        player.getPaddle().down(true);
      } else if (payload === 'up') {
        player.getPaddle().down(false);
      }
    }
  }

  private _removeOverGame(game: Game): void 
  {
    const sockets = game.getSockets();
    this.unique.delete(sockets[0]);
    this.unique.delete(sockets[1]);
    this.games.splice(this.games.indexOf(game), 1);
    console.log('removeOverGame : ' + game.getId());
    this.logger.log(`number of current games: ${this.games.length}`);
  }

  @SubscribeMessage('join_queue_match')
  joinQueue(client: Socket, payload: any) {
    if (this.unique.has(client)) {
      return;
    }
    this.logger.log(`Client ${client.id} joined queue`);
    this.unique.add(client);
    this.queue.unshift(client);
    if (this.queue.length > 1) {
      this.games.push(
        new Game(
          new Player(this.queue.shift(), false),
          new Player(this.queue.shift(), true),
          this._removeOverGame.bind(this),
        ),
      );
    }
  }
}
