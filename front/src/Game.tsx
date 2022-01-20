import React, {useRef , useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import logo from './logo.svg';

const socket = io("http://localhost:5000", {
	reconnectionDelayMax: 10000,
	auth: {
	  token: "123"
	},
	query: {
	  "my-key": "my-value"
	}
  });

const PADDLE_WIDTH = 30;
const PADDLE_HEIGHT = 150;
const WIDTH = 1100;
const HEIGHT = 600;

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
	update(x: number, y: number)
	{
		this._x += x;
		this._y = y;
	}
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
	update(x: number, y: number)
	{
		this._x = x;
		this._y = y;
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

	const [frame, setFrame] = useState<IFrame | null>(null);

	socket.on("state", function (newFrame : any)
		{
			setFrame(newFrame);
		});

	useEffect(function ()
		{
			if (canvasRef == null)
			{
				return;
			}
			const canvas = canvasRef.current;
			const ctx = (canvas != null) ? canvas.getContext('2d') : null;

			if (ctx != null && frame != null)
			{
				const paddleLeft = new Paddle(ctx, 0, ctx.canvas.height / 4,
					PADDLE_WIDTH, PADDLE_HEIGHT, "rgb(25 109 180)");
				const paddleRight = new Paddle(ctx, ctx.canvas.width -
					PADDLE_WIDTH, ctx.canvas.height / 2 - PADDLE_HEIGHT,
					PADDLE_WIDTH, PADDLE_HEIGHT, "black");
				const ball = new Ball(ctx, ctx.canvas.width / 2,
					ctx.canvas.height / 2, 10, "black");
				const background = new Rect(ctx, 0, 0, ctx.canvas.width,
					ctx.canvas.height, "rgb(84 209 136)");

				const gameloop = function ()
				{
					ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
					//background.draw();

					ball.draw();
					ball.update(frame.ball.x, frame.ball.y);

					//paddleLeft.draw();
					//paddleLeft.update();

					//paddleRight.draw();
					//paddleRight.update();
				}
			gameloop();
			}	
		}, [frame]);

	return (
		<div>
		<canvas width={WIDTH} height={HEIGHT} ref={canvasRef}/>
		<br/>
		<button onClick={() => socket.emit("join_queue_match", "dual")}>start game</button>
		<button>start game(with obstacle)</button>
		</div>
	);
}

export default Game;
