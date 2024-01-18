const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
/** soket.io: A client library that loads on the browser side (the socket.io-client package)
 * io is variable due to adding CDN line on index.html
 */
const socket = io();
const scoreEl = document.querySelector("#scoreEl");

const devicePixelRatio = window.devicePixelRatio || 1;

canvas.width = innerWidth * devicePixelRatio;
canvas.height = innerHeight * devicePixelRatio;

const x = canvas.width / 2;
const y = canvas.height / 2;

// const player = new Player(x, y, 10, "white");

/** OB of players from BE:
 * For storing a player from BE via socket.
 * A player is identified by id.
 */
const frontEndplayers = {};
/** connection btw BE: socket's broadcast */
socket.on("updatePlayers", (backEndPlayers) => {
  console.log(backEndPlayers);
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id];
    if (!frontEndplayers[id]) {
      //check the player from BE is existing in FE
      //if not exist, create new player.

      //players[id] = new Player(backEndPlayer.x, backEndPlayer.y, 10, "hsl(0, 100%, 50%");
      frontEndplayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
      });
    }
  }

  /** players : current FE players, different with backEndPlayer from BE */
  for (const id in frontEndplayers) {
    /** Iter current players and compare with updated data: backEndPlayer.
     *  If backEndPlayer[id] is not exist, it means the player who has the id disconnect with BE.
     *  Therefore, update the player object using the id.
     */
    if (!backEndPlayers[id]) {
      delete frontEndplayers[id];
    }
  }

  console.log("[socket.on]", frontEndplayers);
});

let animationId;
let score = 0;
function animate() {
  animationId = requestAnimationFrame(animate);
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);

  // player.draw();

  for (const id in frontEndplayers) {
    const frontEndplayer = frontEndplayers[id];
    frontEndplayer.draw();
  }
}

animate();
// spawnEnemies();

/** Movement  */
