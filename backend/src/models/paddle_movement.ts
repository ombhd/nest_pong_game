import Paddle from "./paddle";

class PaddleMovement {

	private _interval: NodeJS.Timer;


	constructor(paddle: Paddle) {
		this._interval = setInterval(() => paddle.move(), PADDLE_MV_FREQ);
	}

	public clear(): void {
		clearInterval(this._interval);
	}
}

export default PaddleMovement;