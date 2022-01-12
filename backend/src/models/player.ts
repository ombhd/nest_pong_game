import { Socket } from "socket.io";
import Paddle from "./paddle";
import PaddleMovement from "./paddle_movement";

class Player {

	private _socket: Socket;
	private _score: number;
	private _paddle: Paddle;
	private _paddleMovement: PaddleMovement;
	private _isRightSide: boolean;

	constructor(socket: Socket, isRightSide: boolean) {
		this._socket = socket;
		this._isRightSide = isRightSide;
		this._score = 0;
		this._paddle = new Paddle();
		this._paddleMovement = new PaddleMovement(this._paddle);
	}

	// increment score by 1 if it is less than MAX_SCORE,
	// and return true if the new score is MAX_SCORE, 
	// otherwise return false
	public incrementScore(): boolean {
		if (this._score < MAX_SCORE)
			this._score++;
		return this._score == MAX_SCORE;
	}

	public getScore(): number {
		return this._score;
	}

	public isRightSide(): boolean {
		return this._isRightSide;
	}

	public getPaddle(): Paddle {
		return this._paddle;
	}
	
	// return true if the score is MAX_SCORE, 
	// otherwise return false
	public hasWon(): boolean {
		return this._score == MAX_SCORE;
	}

	public disconnect(): void {
		this._paddleMovement.clear();
		this._socket.disconnect();
	}
}

export default Player;