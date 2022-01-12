import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
// import { MatchService } from './matches/matches.service';

interface Paddle {
  y: number;
  dypaddle: number;
}

interface PaddleMovement {
  paddle: Paddle;
  interval: NodeJS.Timer;
}

interface Player {
  socket: Socket;
  score: number;
  paddleMv: PaddleMovement;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  DXY: number;
  goalScoring: boolean;
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
  PAUSED,
  OVER,
}


// canvas dimensions
const WIDTH = 800;
const HEIGHT = 600;
// game state and score
const MAX_SCORE = 10;
const FPS = 1000 / 40;
// ball dimensions and speed
const BALL_RADIUS = 9;
const INIT_DXY = 8;
const MAX_DXY = 19;
// paddle dimensions and speed
const DYP_INIT = 0;
const DYP = 6;
const PADDLE_MV_FREQ = FPS / 2;
const PADDLE_HEIGHT = HEIGHT / 6;
const PADDLE_WIDTH = 10;
const PADDLE_BORDER_RADIUS = PADDLE_WIDTH / 2;
const PADDLE_INIT_Y = (HEIGHT / 2) - (PADDLE_HEIGHT / 2);


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
    clearInterval(game.player1.paddleMv.interval);
    clearInterval(game.player2.paddleMv.interval);
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


  private movePaddle(paddle: Paddle) {
    if (paddle.dypaddle === 0)
      return;
    paddle.y += paddle.dypaddle;
    if (paddle.y + PADDLE_HEIGHT + (PADDLE_WIDTH / 2) > HEIGHT) {
      paddle.y = HEIGHT - PADDLE_HEIGHT - (PADDLE_WIDTH / 2);
      paddle.dypaddle = 0;
      return;
    }
    if (paddle.y < (PADDLE_WIDTH / 2)) {
      paddle.y = (PADDLE_WIDTH / 2);
      paddle.dypaddle = 0;
      return;
    }
  }


  @SubscribeMessage('up_paddle')
  handleUpPaddle(client: Socket, payload: any): void {
    let m = this.matches.find(item => item.game.player1.socket === client || item.game.player2.socket === client);
    if (m) {
      let player = m.game.player1.socket === client ? m.game.player1 : m.game.player2;
      if (payload === 'down') {
        player.paddleMv.paddle.dypaddle = -DYP;
      }
      else if (payload === 'up'){
        player.paddleMv.paddle.dypaddle = 0;
      }
    }
  }

  @SubscribeMessage('down_paddle')
  handleDownPaddle(client: Socket, payload: any): void {
    let m = this.matches.find(item => item.game.player1.socket === client || item.game.player2.socket === client);
    if (m) {
      let player = m.game.player1.socket === client ? m.game.player1 : m.game.player2;
      if (payload === 'down') {
        player.paddleMv.paddle.dypaddle = DYP;
      }
      else if (payload === 'up'){
        player.paddleMv.paddle.dypaddle = 0;
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

    this.goals = 0;
    let pd1 : Paddle = {
      y: PADDLE_INIT_Y,
      dypaddle: DYP_INIT,
    };
    let pd2 : Paddle = {
      y: PADDLE_INIT_Y,
      dypaddle: DYP_INIT,
    };
    let game: Game = {
      id: Math.random().toString(36).substring(7),
      player1: {
        socket: this.queue.pop(),
        score: 0,
        paddleMv: {
          paddle: pd1,
          interval: setInterval(() => this.movePaddle(pd1), PADDLE_MV_FREQ),
        },
      },
      player2: {
        socket: this.queue.pop(),
        score: 0,
        paddleMv: {
          paddle: pd2,
          interval: setInterval(() => this.movePaddle(pd2), PADDLE_MV_FREQ),
        },
      },
      ball: {
        x: WIDTH / 2,
        y: HEIGHT / 2, 
        dx: 1,
        dy: 1,
        DXY: INIT_DXY,
        goalScoring: false,
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

  // reset ball speed
  private resetBall(ball: Ball) {
    ball.DXY = INIT_DXY;
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
  }

  // increment score
  private incrementScore(player: Player, game: Game) {
    if (player.score === MAX_SCORE) {
      return;
    }
    player.score++;
    this.resetBall(game.ball);
  }

  private delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  private goals: number = 0;

  private async recordGoal(player: Player, game: Game) {
    game.ball.dx *= player.score % 2 === 0 ? -1 : 1;
    game.ball.dy *= player.score % 2 === 0 ? -1 : 1;
    this.incrementScore(player, game);
    game.ball.DXY = 0;
    await this.delay(2000);
    game.ball.DXY = INIT_DXY;
    game.ball.goalScoring = false;
  }
  
  private moveBall(ball: Ball) {
    ball.x += (ball.DXY * ball.dx);
    ball.y += (ball.DXY * ball.dy);
  }

  private setVBallScoring(ball: Ball) {
    
  }

  private checkVerticalCollision(game: Game) {
    if (game.ball.x + BALL_RADIUS + PADDLE_WIDTH >= WIDTH) {
      // check if the ball will hit the paddle
      if (game.ball.x > WIDTH + (BALL_RADIUS * 2))
      {
        this.recordGoal(game.player1, game);
        game.hits = 0;
      }
      else if (game.ball.y + BALL_RADIUS >= (game.player2.paddleMv.paddle.y - PADDLE_BORDER_RADIUS) && 
      game.ball.y - BALL_RADIUS <= game.player2.paddleMv.paddle.y + PADDLE_HEIGHT + PADDLE_BORDER_RADIUS) 
      {
        if (++game.hits > 10 && game.ball.DXY > 0) {
          game.ball.DXY+=3;
          if (game.ball.DXY > MAX_DXY) {
            game.ball.DXY = MAX_DXY;
          }
          game.hits = 0;
        }
        if (!game.ball.goalScoring){
          game.ball.dx *= -1;
        }
      }
      else if (game.ball.x + BALL_RADIUS + PADDLE_WIDTH > WIDTH) {
        game.ball.goalScoring = true;
      }
    }
    else if (game.ball.x <= BALL_RADIUS + PADDLE_WIDTH) {
      // check if the ball will hit the paddle
      if (game.ball.x < - (BALL_RADIUS * 2))
      {
        this.recordGoal(game.player2, game);
        game.hits = 0;
      }
      else if (game.ball.y + BALL_RADIUS >= (game.player1.paddleMv.paddle.y - PADDLE_BORDER_RADIUS) && 
      game.ball.y - BALL_RADIUS  <= game.player1.paddleMv.paddle.y + PADDLE_HEIGHT + PADDLE_BORDER_RADIUS) 
      {
        if (++game.hits > 10 && game.ball.DXY > 0){
          game.ball.DXY+=3;
          if (game.ball.DXY > MAX_DXY) {
            game.ball.DXY = MAX_DXY;
          }
          game.hits = 0;
        }
        if (!game.ball.goalScoring){
          game.ball.dx *= -1;
        }
      }
      else if (game.ball.x < BALL_RADIUS + PADDLE_WIDTH) {
        game.ball.goalScoring = true;
      }
    }
    if (game.ball.y + BALL_RADIUS >= HEIGHT) {
      game.ball.dy *= -1;
    }
    else if (game.ball.y <= BALL_RADIUS) {
      game.ball.dy *= -1;
    }
    this.moveBall(game.ball);
  }

  private getGameState(game: Game): GameState {
    if (game.player1.score === MAX_SCORE || game.player2.score === MAX_SCORE) {
      return GameState.OVER;
    }
    else if (game.ball.DXY === 0) {
      return GameState.PAUSED;
    }
    return GameState.PLAYING;
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
        ly: game.player1.paddleMv.paddle.y,
        ry: game.player2.paddleMv.paddle.y
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
