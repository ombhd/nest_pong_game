import React, { useRef, useEffect, useState } from "react";
import socket from "./socket";
import "./index.css";

const Game = () => {
  // constants
  const ref = useRef();
  const WIDTH = 1100;
  const HEIGHT = 600;
  const PADDLE_HEIGHT = HEIGHT / 6;
  const PADDLE_WIDTH = 20;
  const BALL_RADIUS = 9;
  const L_PADDLE_X = 0;
  const R_PADDLE_X = WIDTH - PADDLE_WIDTH;
  const M_PADDLE_X = WIDTH / 2 - PADDLE_WIDTH / 2;
  const PADDLE_INIT_Y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
  const MIDDLE_PADDLE_INIT_Y = HEIGHT - PADDLE_HEIGHT - PADDLE_WIDTH / 2;
  // game states
  const WAITING = "WAITING";
  const PLAYING = "PLAYING";
  const PAUSED = "PAUSED";
  const OVER = "OVER";

  // initial state
  const initialState = {
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
    state: WAITING,
    hasMiddlePaddle: false,
    hasWon: false,
  };
  // state of the frame
  const [frame, setframe] = useState(initialState);

  socket.on("state", (newFrame) => {
    setframe(newFrame);
  });

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === "ArrowUp") {
        socket.emit("up_paddle", "down");
      } else if (e.code === "ArrowDown") {
        socket.emit("down_paddle", "down");
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.code === "ArrowUp") {
        socket.emit("up_paddle", "up");
      } else if (e.code === "ArrowDown") {
        socket.emit("down_paddle", "up");
      }
    });
  }, []);

  useEffect(() => {
    let c = ref.current;
    let ctx = c.getContext("2d");

    function clear_init() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.beginPath();
      ctx.fillStyle = "#1B1B1B";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      draw_separator();
    }

    function draw_ball(color, x, y, radius) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw_paddle(color, x, y) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.beginPath();
      draw_ball(color, x + PADDLE_WIDTH / 2, y, PADDLE_WIDTH / 2);
      draw_ball(
        color,
        x + PADDLE_WIDTH / 2,
        y + PADDLE_HEIGHT,
        PADDLE_WIDTH / 2
      );
    }

    function draw_text(text, color, font, x, y) {
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.fillText(text, x, y);
    }

    function draw_separator() {
      ctx.strokeStyle = "#FFFFFF";
      ctx.setLineDash([10, 15]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
    }

    function draw() {
      clear_init();
      console.log(frame);
      draw_text(
        frame.score.p1,
        "#FFFFFF",
        "50px gameFont",
        3 * (WIDTH / 8),
        HEIGHT / 12
      );
      draw_text(
        frame.score.p2,
        "#FFFFFF",
        "50px gameFont",
        5 * (WIDTH / 8) - 5,
        HEIGHT / 12
      );
      draw_ball("#FFEE00", frame.ball.x, frame.ball.y, BALL_RADIUS);

      draw_paddle("#00D897", L_PADDLE_X, frame.paddles.ly);
      if (frame.hasMiddlePaddle) {
        draw_paddle("#D6D6D6", M_PADDLE_X, frame.paddles.my);
      }

      draw_paddle("#FF6B6B", R_PADDLE_X, frame.paddles.ry);

      if (frame.state === OVER) {
        draw_text(
          "Game Over",
          "#FFFFFF",
          "50px gameFont",
          WIDTH / 2 - 115,
          HEIGHT / 3
        );
        if (frame.hasWon)
          draw_text(
            "You Won",
            "#00FF15",
            "80px gameFont",
            WIDTH / 2 - 150,
            2 * (HEIGHT / 3)
          );
        else
          draw_text(
            "You Lost",
            "#FF0000",
            "80px gameFont",
            WIDTH / 2 - 150,
            2 * (HEIGHT / 3)
          );
      }
    }
    draw();
  }, [frame]);

  return (
    <div>
      <br></br>
      <h1 class="h1"> Trans-Pong </h1>
      <br></br>
      <canvas width={WIDTH} height={HEIGHT} ref={ref}></canvas>
      <br></br>
      <br></br>
      <h1 class="h1"> Join a game</h1>
      <button
        id="btn_join"
        onClick={() => socket.emit("join_queue_match", "dual")}
        class="button button1"
      >
        Dual Pong
      </button>
      <button
        id="btn_join"
        onClick={() => socket.emit("join_queue_match", "triple")}
        class="button button2"
      >
        Triple Pong
      </button>
    </div>
  );
};

export default Game;
