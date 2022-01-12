// map dimensions
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 600;

// game config and score
const FPS = 1000 / 30;
const MAX_SCORE = 10;

// ball dimensions and speed
const BALL_RADIUS = 9;
const BALL_INIT_MV_AMOUNT = 8;
const BALL_MAX_MV_AMOUNT = 19;

// paddle dimensions and speed
const PADDLE_MV_AMOUNT_INIT = 0;
const PADDLE_MV_AMOUNT = 6;
const PADDLE_MV_FREQ = FPS / 2;
const PADDLE_HEIGHT = MAP_HEIGHT / 6;
const PADDLE_WIDTH = 10;
const PADDLE_BORDER_RADIUS = PADDLE_WIDTH / 2;
const PADDLE_INIT_Y = (MAP_HEIGHT / 2) - (PADDLE_HEIGHT / 2);