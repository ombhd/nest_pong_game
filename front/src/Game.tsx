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

const WIDTH = 1100;
const HEIGHT = 600;
const PADDLE_HEIGHT = HEIGHT / 6;
const PADDLE_WIDTH = 20;
const L_PADDLE_X = 0;
const R_PADDLE_X = WIDTH - PADDLE_WIDTH;

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
		}, [frame]);

	return (
		<div>
		<canvas width={WIDTH} height={HEIGHT} ref={canvasRef}/>
		<br/>
		<button onClick={() => socket.emit("join_queue_match", "dual")}>
		start game</button>
		<button>start game(with obstacle)</button>
		</div>
	);
}

export default Game;
