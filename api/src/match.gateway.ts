import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
// import { MatchService } from './matches/matches.service';

interface Paddle {
  y: number;
}

interface Player {
  socket?: Socket;
  score: number;
  paddle: Paddle;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  DXY: number;
}

interface Game {
  id: string;
  player1: Player;
  player2: Player;
  ball: Ball;
  hits: number;
}

interface Match {
  id: string;
  game: Game;
  interval: NodeJS.Timer;
}

enum GameState{
  WAITING,
  PLAYING,
  OVER
}

const WIDTH = 800;
const HEIGHT = 600;
const BALL_RADIUS = 9;
const INIT_DXY = 10;
const MAX_DXY = 19;
const DYP = HEIGHT / 12;
const FPS = 1000 / 30;
const PADDLE_HEIGHT = HEIGHT / 6;
const PADDLE_WIDTH = 10;
const PADDLE_INIT_Y = (HEIGHT / 2) - (PADDLE_HEIGHT / 2);
const MAX_SCORE = 10;


@WebSocketGateway(5000, { cors: { origin: '*' } })
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private logger: Logger = new Logger('MatchGateway');


  // constructor(private matchService: MatchService) {
  //   this.matchService.hello();
  // }

  private unique: Set<Socket> = new Set();
  private queue: Socket[] = [];
  private matches: Match[] = [];

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    let index : number = this.queue.indexOf(client);
    if (index > -1) {
      let removedElem = this.queue.splice(index, 1);
      this.logger.log(`Client removed from queue : ${removedElem[0].id}`);
    }
    let m = this.matches.find(item => item.game.player1.socket === client || item.game.player2.socket === client);
    this.handleMatchDisconnect(m, client);
  }

  handleMatchDisconnect(m: Match, client: Socket) {
    if (m) {
      clearInterval(m.interval);
      if (m.game.player1.socket !== client) {
        m.game.player1.score = MAX_SCORE;
        m.game.player2.score = 0;
      } else {
        m.game.player2.score = MAX_SCORE;
        m.game.player1.score = 0;
      }
      this.broadcastGameState(m.game);
      this.removeGamePlayers(m.game);
      this.matches.splice(this.matches.indexOf(m), 1);
    }
  }

  private removeGamePlayers(game: Game) {
    this.queue.splice(this.queue.indexOf(game.player1.socket), 1);
    this.queue.splice(this.queue.indexOf(game.player2.socket), 1);
    this.unique.delete(game.player1.socket);
    this.unique.delete(game.player2.socket);
  }

  afterInit(server: any) {
    this.logger.log('Initialized');
  }
  
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('up_paddle')
  handleUpPaddle(client: Socket, payload: any): void {
    let m = this.matches.find(item => item.game.player1.socket === client || item.game.player2.socket === client);
    if (m) {
      let player = m.game.player1.socket === client ? m.game.player1 : m.game.player2;
      player.paddle.y -= DYP;
      if (player.paddle.y < 0) {
        player.paddle.y = 0;
    }
    }
  }

  @SubscribeMessage('down_paddle')
  handleDownPaddle(client: Socket, payload: any): void {
    let m = this.matches.find(item => item.game.player1.socket === client || item.game.player2.socket === client);
    if (m) {
      let player = m.game.player1.socket === client ? m.game.player1 : m.game.player2;
      player.paddle.y += DYP;
      if (player.paddle.y + PADDLE_HEIGHT > HEIGHT) {
        player.paddle.y = HEIGHT - PADDLE_HEIGHT;
      }
    }
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
      this.startNewGame();
    }
  }

// WIDTH 600 x HEIGHT 400
  private startNewGame() {
    let game: Game = {
      id: Math.random().toString(36).substring(7),
      player1: {
        socket: this.queue.pop(),
        score: 0,
        paddle: {
          y: PADDLE_INIT_Y
        },
      },
      player2: {
        socket: this.queue.pop(),
        score: 0,
        paddle: {
          y: PADDLE_INIT_Y
        },
      },
      ball: {
        x: WIDTH / 2,
        y: HEIGHT / 2, 
        dx: 1,
        dy: 1,
        DXY: INIT_DXY
      },
      hits: 0
    };
    this.startNewMatch(game);
  }

  private startNewMatch(game: Game) {
    this.matches.push({
      game,
      id: game.id,
      interval: setInterval(() => this.broadcastSingleGameState(game), FPS)
    });
  }

  private checkIsWinner(player: Player): boolean {
    return player.score === MAX_SCORE;
  }

  // increment score
  private incrementScore(player: Player, game: Game) {
    if (player.score === MAX_SCORE) {
      return;
    }
    player.score++;
    this.resetBallSpeed(game);
  }

  private checkVerticalCollision(game: Game) {
    if (game.ball.x + BALL_RADIUS + PADDLE_WIDTH > WIDTH) {
      // check if the ball will hit the paddle
      if (game.ball.y + BALL_RADIUS >= game.player2.paddle.y && 
        game.ball.y - BALL_RADIUS <= game.player2.paddle.y + PADDLE_HEIGHT) 
      {
        if (++game.hits > 10){
          game.ball.DXY+=3;
          if (game.ball.DXY > MAX_DXY) {
            game.ball.DXY = MAX_DXY;
          }
          game.hits = 0;
        }
        game.ball.dx *= -1;
      }
      else
      {
        this.incrementScore(game.player1, game);
        game.ball.x = WIDTH / 2;
        game.ball.y = HEIGHT / 2;
        game.ball.dx *= -1;
      }
    }
    if (game.ball.x < BALL_RADIUS + PADDLE_WIDTH) {
      // check if the ball will hit the paddle
      if (game.ball.y + BALL_RADIUS >= game.player1.paddle.y && 
        game.ball.y - BALL_RADIUS  <= game.player1.paddle.y + PADDLE_HEIGHT) 
      {
        if (++game.hits > 10){
          game.ball.DXY+=3;
          if (game.ball.DXY > MAX_DXY) {
            game.ball.DXY = MAX_DXY;
          }
          game.hits = 0;
        }
        game.ball.dx *= -1;
      }
      else
      {
        game.ball.dx *= -1;
        this.incrementScore(game.player2, game);
        game.ball.x = WIDTH / 2;
        game.ball.y = HEIGHT / 2;
      }
    }
    if (game.ball.y + BALL_RADIUS > HEIGHT) {
      game.ball.dy *= -1;
    }
    if (game.ball.y < BALL_RADIUS) {
      game.ball.dy *= -1;
    }
    game.ball.x += (game.ball.DXY * game.ball.dx);
    game.ball.y +=( game.ball.DXY * game.ball.dy);
  }

  private getGameState(game: Game): GameState {
    if (game.player1.score === MAX_SCORE || game.player2.score === MAX_SCORE) {
      return GameState.OVER;
    }
    return GameState.PLAYING;
  }

  // reset ball speed
  private resetBallSpeed(game: Game) {
    game.ball.DXY = INIT_DXY;
  }

  // stop a game
  private stopGame(game: Game) {
    let m = this.matches.find(item => item.id === game.id);
    if (m) {
      clearInterval(m.interval);
      this.matches.splice(this.matches.indexOf(m), 1);
      this.removeGamePlayers(game);
    }
  }

  // emit game state to all players
  private broadcastGameState(game: Game) {
    const globalState = {
      ball: {
        x: game.ball.x,
        y: game.ball.y
      },
      paddles: {
        ly: game.player1.paddle.y,
        ry: game.player2.paddle.y
      },
      score:
      {
        p1: game.player1.score,
        p2: game.player2.score
      },
      state: this.getGameState(game)
    }
    game.player1.socket.emit('game_state', {...globalState, is_winner: this.checkIsWinner(game.player1)});
    game.player2.socket.emit('game_state', {...globalState, is_winner: this.checkIsWinner(game.player2)});
  
    if (globalState.state === GameState.OVER) {
      this.stopGame(game);
    }
  }

  private broadcastSingleGameState(game: Game) {

    this.checkVerticalCollision(game);
    this.broadcastGameState(game);
  }

}
