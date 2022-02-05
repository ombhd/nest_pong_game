import React, {useRef , useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import logo from './logo.svg';
import './Game.css';

const socket = io("http://localhost:5000", {
	reconnectionDelayMax: 10000,
	auth: {
	  token: "123"
	},
	query: {
	  "my-key": "my-value"
	}
  });

const WIDTH = 1100;
const HEIGHT = 600;
const PADDLE_HEIGHT = HEIGHT / 6;
const PADDLE_WIDTH = 20;
const L_PADDLE_X = 0;
const R_PADDLE_X = WIDTH - PADDLE_WIDTH;
const MIDDLE_PADDLE_INIT_Y = HEIGHT - PADDLE_HEIGHT - PADDLE_WIDTH / 2;
const PADDLE_INIT_Y = HEIGHT / 2 - PADDLE_HEIGHT / 2;

class Circle
{
	_ctx: CanvasRenderingContext2D;
	_x: number;
	_y: number;
	_r: number;
	_color: string;

	constructor(ctx: CanvasRenderingContext2D, x: number, y: number,
		r: number, color: string)
	{
		this._ctx = ctx;
		this._x = x;
		this._y = y;
		this._r = r;
		this._color = color;
	}
	draw()
	{
		this._ctx.beginPath();
		this._ctx.fillStyle = this._color;
		this._ctx.arc(this._x, this._y, this._r, 0, Math.PI * 2);
		this._ctx.fill();
		this._ctx.closePath();
	}
}

class Ball extends Circle
{
}

class Rect
{
	_ctx: CanvasRenderingContext2D;
	_x: number;
	_y: number;
	_width: number;
	_height: number;
	_color: string;

	constructor(ctx: CanvasRenderingContext2D, x: number, y: number,
		width: number, height: number, color: string)
	{
		this._ctx = ctx;
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		this._color = color;
	}
	draw()
	{
		this._ctx.beginPath();
		this._ctx.fillStyle = this._color;
		this._ctx.rect(this._x, this._y, this._width, this._height);
		this._ctx.fill();
		this._ctx.closePath();
	}
}

class Paddle extends Rect
{
	drawWithCircle()
	{
		const upCircle = new Circle(this._ctx, this._x + PADDLE_WIDTH / 2,
			this._y, PADDLE_WIDTH / 2, this._color);
		const downCircle = new Circle(this._ctx, this._x + PADDLE_WIDTH / 2,
			this._y + PADDLE_HEIGHT, PADDLE_WIDTH / 2, this._color);

		this.draw();
		upCircle.draw();
		downCircle.draw();
	}
}

interface IFrame
{
	ball: {x: number, y: number},
		paddles: {ly: number, ry: number, my: number},
		score: {p1: number, p2:number}
	state: string,
		hasMiddlePaddle: boolean,
		hasWon: boolean
}


function Game()
{
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const initialState = 
		{
			ball: {
				x: WIDTH / 2,
				y: HEIGHT / 2,
			},
			paddles: {
				ly: PADDLE_INIT_Y,
				ry: PADDLE_INIT_Y,
				my: MIDDLE_PADDLE_INIT_Y,
			},
			score: {
				p1: 0,
				p2: 0,
			},
			state: "NOTHING",
			hasMiddlePaddle: false,
			hasWon: false
		};
	const [frame, setFrame] = useState<IFrame>(initialState);
	const gameListBtnRef :React.RefObject<HTMLDivElement> = React.createRef(); 
	const controlRef :React.RefObject<HTMLDivElement> = React.createRef(); 
		
	const startGame = function(){
		socket.emit("join_queue_match", "dual");
		if (gameListBtnRef != null)
			if (gameListBtnRef.current != null)
			gameListBtnRef.current.style.display = "none";
	}

	socket.on("state", function (newFrame : any)
		{
			setFrame(newFrame);
		});

	useEffect(function ()
		{
			document.addEventListener("keydown", (e) =>
				{
					if (e.code === "ArrowUp")
					{
						socket.emit("up_paddle", "down");
					}
					else if (e.code === "ArrowDown")
					{
						socket.emit("down_paddle", "down");
					}
				});
			document.addEventListener("keyup", (e) =>
				{
					if (e.code === "ArrowUp")
					{
						socket.emit("up_paddle", "up");
					}
					else if (e.code === "ArrowDown")
					{
						socket.emit("down_paddle", "up");
					}
				});
		});

	useEffect(function ()
		{
			console.log(frame);
			if (canvasRef == null)
			{
				return;
			}
			const canvas = canvasRef.current;
			const ctx = (canvas != null) ? canvas.getContext('2d') : null;

			if (ctx != null && frame.state != "NOTHING")
			{
				if (canvas)
					canvas.style.display = "block";

				if (controlRef != null)
					if (controlRef.current != null)
						controlRef.current.style.display = "none";	

				const background = new Rect(ctx, 0, 0, ctx.canvas.width,
					ctx.canvas.height, "rgb(84 209 136)");

				background.draw();

				const paddleLeft = new Paddle(ctx, L_PADDLE_X, frame.paddles.ly,
					PADDLE_WIDTH, PADDLE_HEIGHT, "rgb(25 109 180)");
				const paddleRight = new Paddle(ctx, R_PADDLE_X,
					frame.paddles.ry,
					PADDLE_WIDTH, PADDLE_HEIGHT, "black");
				const ball = new Ball(ctx,  frame.ball.x, frame.ball.y
					, 10, "black");

				paddleLeft.drawWithCircle();
				paddleRight.drawWithCircle();
				ball.draw();
			}
			else
			{

			}
		}, [frame]);

	return (
		<div>
		<canvas width={WIDTH} height={HEIGHT} ref={canvasRef}/>
		<br/>
		<div ref={controlRef} className="game-control">
		<div ref={gameListBtnRef} className="game-list-btn">
		<button className="game-btn"
		onClick={startGame}>
		start game</button>
		<br/>
		<button className="game-btn">start game(with obstacle)</button>
		</div>
		</div>
		</div>
	);
}
export default Game;
