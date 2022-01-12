class Paddle
{
	private _y: number;
	private _yMvAmount: number;

	constructor() {
		this._y = PADDLE_INIT_Y;
		this._yMvAmount = PADDLE_MV_AMOUNT_INIT;
	}

	public move(): void {
		if (this._yMvAmount === 0)
		  return;
		this._y += this._yMvAmount;
		if (this._y + PADDLE_HEIGHT + PADDLE_BORDER_RADIUS > MAP_HEIGHT) {
		  this._y = MAP_HEIGHT - PADDLE_HEIGHT - PADDLE_BORDER_RADIUS;
		  this._yMvAmount = 0;
		  return;
		}
		if (this._y < PADDLE_BORDER_RADIUS) {
		  this._y = PADDLE_BORDER_RADIUS;
		  this._yMvAmount = 0;
		  return;
		}
	}

	public up(keydown: boolean): void {
		if (keydown) {
		  this._yMvAmount = -PADDLE_MV_AMOUNT;
		} else {
		  this._yMvAmount = 0;
		}
	}

	public down(keydown: boolean): void {
		if (keydown) {
		  this._yMvAmount = PADDLE_MV_AMOUNT;
		} else {
		  this._yMvAmount = 0;
		}
	}

}

export default Paddle;