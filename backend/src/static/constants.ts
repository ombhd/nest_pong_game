
class Constants{
// map dimensions
static readonly MAP_WIDTH = 800;
static readonly MAP_HEIGHT = 600;

// game config and score
static readonly FPS = 1000 / 30;
static readonly MAX_SCORE = 10;
static readonly MAX_WATCHERS = 10;
static readonly MAX_DISTANCE_FROM_MAP_EDGE = Constants.MAP_WIDTH / 4;

// ball dimensions and speed
static readonly BALL_RADIUS = 9;
static readonly BALL_INIT_MV_AMOUNT = 8;
static readonly BALL_MAX_MV_AMOUNT = 20;
static readonly BALL_MV_AMOUNT_INCREASE = 3;
static readonly MAX_HITS_BEFORE_INCREASE = 6;

// paddle dimensions and speed
static readonly PADDLE_WIDTH = 10;
static readonly LEFT_PADDLE_X = Constants.PADDLE_WIDTH;
static readonly RIGHT_PADDLE_X = Constants.MAP_WIDTH - Constants.PADDLE_WIDTH;
static readonly PADDLE_MV_AMOUNT_INIT = 0;
static readonly PADDLE_MV_AMOUNT = 6;
static readonly PADDLE_MV_FREQ = Constants.FPS / 2;
static readonly PADDLE_HEIGHT = Constants.MAP_HEIGHT / 6;
static readonly PADDLE_BORDER_RADIUS = Constants.PADDLE_WIDTH / 2;
static readonly PADDLE_INIT_Y = (Constants.MAP_HEIGHT / 2) - (Constants.PADDLE_HEIGHT / 2);
}

export default Constants;