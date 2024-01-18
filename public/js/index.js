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

      ///////////////////////////
      // Server Reconciliation //
      ///////////////////////////

      if (id == socket.id) {
        // 내가 조종하는 화면에서의 update handling

        frontEndplayers[id].x = backEndPlayer.x;
        frontEndplayers[id].y = backEndPlayer.y;

        ///////////////////////////////////////
        /** Slicing playerInputs [current :] */
        ///////////////////////////////////////

        /** [1] Grab & Find idx
         *
         * grab pl inputs, find idx of the event we are currently on.
         * playerInputs contains object:{ sequenceNumber, dx: 0, dy: -SPEED }
         */
        const lastBackEndInputIndex = playerInputs.findIndex((input) => {
          // each backEndPlayer has a seq num.
          return backEndPlayer.sequenceNumber === input.sequenceNumber;
        });

        /**[2] Slice the array */
        if (lastBackEndInputIndex > -1) {
          playerInputs.splice(0, lastBackEndInputIndex + 1);
        }

        playerInputs.forEach((input) => {
          frontEndplayers[id].x += input.dx;
          frontEndplayers[id].y += input.dy;
        });
      } else {
        /**
         * for all player, to take BE player position,
         * and assign it to our FE player's position
         *
         * 내 화면에 보여지는 다른 플레이어들의 위치를 위한 update handling
         *
         */
        frontEndplayers[id].x = backEndPlayer.x;
        frontEndplayers[id].y = backEndPlayer.y;
      }
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
/** Trace player inputs */
const playerInputs = [];
let sequenceNumber = 0;
setInterval(() => {
  if (keys.ArrowUp.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED }); //destructing
    frontEndplayers[socket.id].y -= SPEED;
    socket.emit("keydown", { keycode: "ArrowUp", sequenceNumber });
  }
  if (keys.ArrowDown.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: +SPEED });
    frontEndplayers[socket.id].y += SPEED;
    socket.emit("keydown", { keycode: "ArrowDown", sequenceNumber });
  }
  if (keys.ArrowRight.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: +SPEED, dy: 0 });
    frontEndplayers[socket.id].x += SPEED;
    socket.emit("keydown", { keycode: "ArrowRight", sequenceNumber });
  }
  if (keys.ArrowLeft.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 });
    frontEndplayers[socket.id].x -= SPEED;
    socket.emit("keydown", { keycode: "ArrowLeft", sequenceNumber });
  }

  //console.log("playerInputs", playerInputs);
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
