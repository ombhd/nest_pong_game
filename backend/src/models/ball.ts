class Ball {

	private _x: number;
	private _y: number;
	private _xdirection: number;
	private _ydirection: number;
	private _mvAmount: number;
	private _isScoring: boolean;
	private _hits: number;


	constructor() {
		this._x = MAP_WIDTH / 2;
		this._y = MAP_HEIGHT / 2;
		this._xdirection = 1;
		this._ydirection = 1;
		this._mvAmount = BALL_INIT_MV_AMOUNT;
		this._isScoring = false;
		this._hits = 0;
	}

	public reset(): void {
		this._x = MAP_WIDTH / 2;
		this._y = MAP_HEIGHT / 2;
		this._mvAmount = BALL_INIT_MV_AMOUNT;
		this._isScoring = false;
		this._hits = 0;
	}

	public move(): void {
		this._x += this._xdirection * this._mvAmount;
		this._y += this._ydirection * this._mvAmount;
	}

	public isVCollision(y: number): boolean {
		return this._y + BALL_RADIUS >= y && this._y - BALL_RADIUS <= y;
	}

	public isHCollision(x: number): boolean {
		const isInCollision = this._x + BALL_RADIUS >= x && this._x - BALL_RADIUS <= x;;
		return isInCollision;
	}

}

export default Ball;