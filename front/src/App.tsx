import {useRef, useEffect} from 'react';
import logo from './logo.svg';
import Game from './Game';
import './App.css';

const PADDLE_WIDTH = 30;
const PADDLE_HEIGHT = 150;
let KEY_DOWN :string = "";

function map(current: number, in_min: number, in_max: number, out_min: number,
	out_max: number): number
{
	return ((current - in_min) * (out_max - out_min)) / (in_max - in_min) +
		out_min;
}

class Ball
{
	_ctx: CanvasRenderingContext2D;
	_x: number;
	_y: number;
	_r: number;
	_color: string;
	_yspeed: number = 10;
	_xspeed: number = 10;

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
	update(paddleOne : Paddle, paddleTwo : Paddle)
	{
		if (((this._x - this._r >= 0 && this._x + this._r <= this._ctx.canvas.width)
		&& paddleOne.isHitBall(this) === true) 
			|| this._x + this._r > this._ctx.canvas.width)
		{
			this._xspeed *= -1;
		}
		if ((this._y + this._r > this._ctx.canvas.height || this._y - this._r < 0)
			|| paddleOne.isHitBall(this) === true)
		{
			if (paddleOne.isHitBall(this) === true) 
			{
				const angle = map(this._y - paddleOne._center.y, -1 * (paddleOne._height / 2)
					, paddleOne._height / 2, -30, 30);
				
				this._yspeed = angle * ((Math.PI * 2) / 180) * this._xspeed;
			}
			else
			{
				this._yspeed *= -1;
			}
		}
		this._x += this._xspeed;
		this._y += this._yspeed;
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
		this._ctx.rect(this._x, this._y, this._width,
			this._height);
		this._ctx.fill();
		this._ctx.closePath();

	}
}
/*
 * if all you have is a super call (with the same argument the class is
 * created with), the constructor doesn't do anything useful, because classes 
 * will already call super automatically
 *
 * constructor(ctx: CanvasRenderingContext2D, x: number, y: number,
 * 	width: number, height: number, color: string)
 * {
 * 	super(ctx, x, y, width, height, color);
 * }
 */

class Paddle extends Rect
{
	_xspeed: number = 7;
	_yspeed: number = 7;
	_center: {x: number, y: number};
	_isLeft: boolean;

	constructor(ctx: CanvasRenderingContext2D, x: number, y: number,
		width: number, height: number, isLeft: boolean, color: string)
	{
		super(ctx, x, y, width, height, color);
		this._center = {x: this._x + this._width / 2, y: this._y +
			this._height / 2};
		this._isLeft = isLeft;
	}
	isHitBall(ball: Ball)
	{
		let yLowerBound = this._y;
		let yUpperBound = this._y + this._height;

		if (yUpperBound > this._ctx.canvas.height)
			yUpperBound = this._ctx.canvas.height;

		if (this._isLeft === true)
		{
			if ((ball._y + ball._r > yLowerBound && ball._x > this._width / 4) 
				&& (ball._y - ball._r < yUpperBound && ball._x > this._width / 4)
				&& (ball._x - ball._r <= this._x + this._width))
			{
				//console.log("hit");
				return (true);
			}
		}
		return (false);
	}
	update()
	{
		if (KEY_DOWN === "ArrowUp" && this._y > 0)
			this._y -= this._yspeed;
		else if (KEY_DOWN === "ArrowDown"
			&& this._y + this._height < this._ctx.canvas.height)
			this._y += this._yspeed;
		this._center.y = this._y + this._height / 2;
	}
}

function keyDown(e: KeyboardEvent)
{
	KEY_DOWN = e.code;
}

function keyUp(e: KeyboardEvent)
{
	KEY_DOWN = "";
}

function App() 
{
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() =>
		{
			if (canvasRef != null)
			{
				const canvas = canvasRef.current;
				const ctx = (canvas != null) ? canvas.getContext('2d') : null;

				if (ctx != null)
				{
					const paddleOne = new Paddle(ctx, 0, ctx.canvas.height / 4,
						PADDLE_WIDTH, PADDLE_HEIGHT, true, "rgb(25 109 180)");
					const paddleTwo = new Paddle(ctx, ctx.canvas.width -
						PADDLE_WIDTH, ctx.canvas.height / 2 - PADDLE_HEIGHT,
						PADDLE_WIDTH, PADDLE_HEIGHT, false, "black");
					const ball = new Ball(ctx, ctx.canvas.width / 2,
						ctx.canvas.height / 2, 10, "black");
					const background = new Rect(ctx, 0, 0, ctx.canvas.width,
						ctx.canvas.height, "rgb(84 209 136)");

					const gameloop = function (timestamp: number) 
					{
						ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
						background.draw();

						ball.draw();
						ball.update(paddleOne, paddleTwo);

						paddleOne.draw();
						paddleOne.update();

						//paddleTwo.draw();
						//paddleTwo.update();
						window.requestAnimationFrame(gameloop);

					}
					window.requestAnimationFrame(gameloop);
				}
			}
			document.addEventListener("keydown", keyDown);
			document.addEventListener("keyup", keyUp);
		});
	return (
		<div className="App">
		<Game/>
		{/*<canvas width={1000} height={500} ref={canvasRef}></canvas>*/}
		</div>
	);
}

export default App;
