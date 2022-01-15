import { Socket } from 'socket.io';
import { GameStateEnum } from '../static/enums';
import Constants from '../static/constants';
import Ball from './ball';
import Player from './player';

interface BroadcastObject {
  ball: {
    x: number;
    y: number;
  };
  paddles: {
    ly: number;
    ry: number;
  };
  score: {
    p1: number;
    p2: number;
  };
  state: GameStateEnum;
}

class Game {
  private _id: string;
  private _player1: Player;
  private _player2: Player;
  private _watchers: Socket[] = [];
  private _ball: Ball;
  private _interval: NodeJS.Timer;

  constructor(player1: Player, player2: Player) {
    this._id = this._generateId();
    this._player1 = player1;
    this._player2 = player2;
    this._ball = new Ball();
    this._interval = setInterval(() => this.play(), Constants.FPS);
  }

  public restart(): void {
    if (this.isOver()) {
      this._id = this._generateId();
      this._ball.reset();
      this._player1.reset();
      this._player2.reset();
      this._interval = setInterval(() => this.play(), Constants.FPS);
    }
  }

  private _generateId(): string {
    let id: string = '';
    let characters: string =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength: number = characters.length;
    for (let i: number = 0; i < 25; i++) {
      id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return id;
  }

  public;

  public getGameState(): GameStateEnum {
    if (
      this._player1.getScore() === Constants.MAX_SCORE ||
      this._player2.getScore() === Constants.MAX_SCORE
    ) {
      return GameStateEnum.OVER;
    } else if (this._ball.isPaused()) {
      return GameStateEnum.PAUSED;
    }
    return GameStateEnum.PLAYING;
  }

  public buildGameStateObject(): BroadcastObject {
    return {
      ball: {
        x: this._ball.getX(),
        y: this._ball.getY(),
      },
      paddles: {
        ly: this._player1.getPaddle().getY(),
        ry: this._player2.getPaddle().getY(),
      },
      score: {
        p1: this._player1.getScore(),
        p2: this._player2.getScore(),
      },
      state: this.getGameState(),
    };
  }

  public addWatcher(socket: Socket): boolean {
    if (this._watchers.length < Constants.MAX_WATCHERS) {
      this._watchers.push(socket);
      return true;
    }
    return false;
  }

  private broadcastState(): void {
    const currentState = this.buildGameStateObject();
    this._player1
      .getSocket()
      .emit('state', { ...currentState, hasWon: this._player1.hasWon() });
    this._player2
      .getSocket()
      .emit('state', { ...currentState, hasWon: this._player2.hasWon() });
    // TODO: send to watchers
    // this._watchers.forEach((watcher) => watcher.emit('state', currentState));
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public hasSockets(socket1: Socket, socket2: Socket): boolean {
    return (
      this._player1.getSocket() === socket1 &&
      this._player2.getSocket() === socket2
    );
  }

  public async pauseTheGame(ms: number): Promise<void>  {
    
  }

  private async awardAndPause(player: Player): Promise<void> {
    this._player1.award();
    this._ball.reset();
    this.broadcastState();
    this._ball.pause();
    await this.delay(1500);
    this._ball.resume();
  }

  public  play(): void{
    if (this._ball.handleHCollision(this._player1.getPaddle())) {
      this.awardAndPause(this._player1);
    }
    if (this._ball.handleHCollision(this._player2.getPaddle())) {
      this.awardAndPause(this._player2);
    }
    this._ball.handleVCollision(0, Constants.MAP_HEIGHT);
    this._ball.move();
    this.broadcastState();
    if (this.getGameState() === GameStateEnum.OVER) {
      this.stop();
    }
  }

  public hasSocket(socket: Socket): boolean {
    return (
      this._player1.getSocket() === socket ||
      this._player2.getSocket() === socket
    );
  }

  public getPlayerBySocket(socket: Socket): Player {
    if (this._player1.getSocket() === socket) {
      return this._player1;
    } else if (this._player2.getSocket() === socket) {
      return this._player2;
    }
    return null;
  }

  public handlePlayerDisconnect(socket: Socket): void {
    if (socket.id === this._player1.getSocket().id) {
      this._player1.penalize();
      this._player2.award(Constants.MAX_SCORE);
    } else if (socket.id === this._player2.getSocket().id) {
      this._player2.penalize();
      this._player1.award(Constants.MAX_SCORE);
    }
    this.broadcastState();
    this.stop();
  }

  public stop(): void {
    clearInterval(this._interval);
    this._player1.disconnect();
    this._player2.disconnect();
  }

  public isOver(): boolean {
    return this.getGameState() === GameStateEnum.OVER;
  }

  public pause(): void {
    this._ball.pause();
  }
}

export default Game;
