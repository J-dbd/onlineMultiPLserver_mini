const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
/** soket.io: A client library that loads on the browser side (the socket.io-client package)
 * io is variable due to adding CDN line on index.html
 */
const socket = io(); // identifier!
const scoreEl = document.querySelector("#scoreEl");

const devicePixelRatio = window.devicePixelRatio || 1;

canvas.width = innerWidth * devicePixelRatio;
canvas.height = innerHeight * devicePixelRatio;

const x = canvas.width / 2;
const y = canvas.height / 2;

/** OB of players from BE:
 * For storing a player from BE via socket.
 * A player is identified by id.
 */
const frontEndplayers = {};

/** connection btw BE: socket's broadcast */
// listening on every events through socket
socket.on("updatePlayers", (backEndPlayers) => {
  //console.log(backEndPlayers);

  /* [1] render new player */
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id];

    //check the player from BE is existing in FE
    //if not exist, create new player.
    if (!frontEndplayers[id]) {
      /**
       * It's recommended to pass arguments as an object with explicitly named properties.
       * This provides better clarity and understanding of what attributes are being passed.
       * Compare the commented code, where arguments are passed without any context,
       * to the active code where properties of the player are clearly stated.
       *
       * players[id] = new Player(backEndPlayer.x, backEndPlayer.y, 10, "hsl(0, 100%, 50%");
       */

      frontEndplayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
      });
    } else {
      // if a player already exist, update it.
      frontEndplayers[id].x = backEndPlayer.x;
      frontEndplayers[id].y = backEndPlayer.y;
    }
  }

  /* [2] Real-time Rendering players
   * players : current FE players, different with backEndPlayer from BE */
  for (const id in frontEndplayers) {
    /** Iter current players and compare with updated data: backEndPlayer.
     *  If backEndPlayer[id] is not exist, it means the player who has the id disconnect with BE.
     *  Therefore, update the player object using the id.
     */
    if (!backEndPlayers[id]) {
      delete frontEndplayers[id];
    }
  }

  /** [3] Reat-time Movement Rendering */

  //console.log("[socket.on]", frontEndplayers);
});

let animationId;
let score = 0;
function animate() {
  animationId = requestAnimationFrame(animate);
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);

  for (const id in frontEndplayers) {
    const frontEndplayer = frontEndplayers[id];
    frontEndplayer.draw();
  }
}

animate();

/////////////////
/** Movement  */
////////////////

// In web coordinates of 2D, the top left corner is the origin (0,0).
// As the Y-coordinate increases, it points downwards on the screen.
// direct socket.emit with addEventListener

/** Movement upgrade : clinet predication  */
/**
 * To predict the client's location,
 * the server updates the player's location at the same interval (0.15 seconds).
 * To sync with this cycle, detect whether the key has been pressed or not
 * and update it simultaneously
 *
 * client의 위치를 예측하기 위하여, 동일한 주기(0.15초) 마다 서버는 player의 위치를 update한다.
 * 이와 주기를 맞추어 key가 눌렸는지 눌리지 않았는지를 감지하여 동시에 업데이트 해주어야 한다.
 */

const keys = {
  ArrowUp: {
    pressed: false,
  },
  ArrowDown: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  ArrowLeft: {
    pressed: false,
  },
};

const SPEED = 10;
setInterval(() => {
  if (keys.ArrowUp.pressed) {
    frontEndplayers[socket.id].y -= SPEED;
    socket.emit("keydown", "ArrowUp");
  }
  if (keys.ArrowDown.pressed) {
    frontEndplayers[socket.id].y += SPEED;
    socket.emit("keydown", "ArrowDown");
  }
  if (keys.ArrowRight.pressed) {
    frontEndplayers[socket.id].x += SPEED;
    socket.emit("keydown", "ArrowRight");
  }
  if (keys.ArrowLeft.pressed) {
    frontEndplayers[socket.id].x -= SPEED;
    socket.emit("keydown", "ArrowLeft");
  }
}, 15);

window.addEventListener("keydown", (event) => {
  if (!frontEndplayers[socket.id]) return;
  switch (event.code) {
    case "ArrowUp":
      keys.ArrowUp.pressed = true;
      break;
    case "ArrowDown":
      keys.ArrowDown.pressed = true;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = true;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  if (!frontEndplayers[socket.id]) return;
  switch (event.code) {
    case "ArrowUp":
      keys.ArrowUp.pressed = false;
      break;
    case "ArrowDown":
      keys.ArrowDown.pressed = false;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
  }
});
