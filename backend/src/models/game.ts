import Ball from "./ball";
import Player from "./player";

class Game {

	private _player1: Player;
	private _player2: Player;
	private _ball: Ball;

	constructor(player1: Player, player2: Player) {
		this._player1 = player1;
		this._player2 = player2;
		this._ball = new Ball();
	}
		
}