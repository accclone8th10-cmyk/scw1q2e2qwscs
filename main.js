const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- CONFIG WORLD ---
const WORLD = {
    width: 2000,
    height: 2000,
    tileSize: 100
};

const player = {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    size: 36,
    speed: 250,
    linhKhi: 0,
    realm: 0,
    angle: 0,
    state: "idle"
};

// Camera để theo dõi nhân vật
const camera = { x: 0, y: 0 };

// Danh sách vật cản (Đá)
const rocks = [
    { x: 500, y: 500, r: 40 },
    { x: 1200, y: 800, r: 60 },
    { x: 800, y: 1500, r: 50 }
];

// --- INPUT ---
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- LOGIC ---
function update(dt) {
    // 1. Di chuyển
    let dx = 0, dy = 0;
    if (keys["w"]) dy--; if (keys["s"]) dy++;
    if (keys["a"]) dx--; if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        let nextX = player.x + (dx / len) * player.speed * dt;
        let nextY = player.y + (dy / len) * player.speed * dt;

        // Giới hạn biên bản đồ
        player.x = Math.max(0, Math.min(WORLD.width, nextX));
        player.y = Math.max(0, Math.min(WORLD.height, nextY));
        player.state = "move";
    } else {
        player.state = "idle";
    }

    // 2. Cập nhật Camera (Giữ player ở giữa)
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    player.angle += dt;
}

// --- DRAWING ---
function drawMap() {
    ctx.save();
    // Dịch chuyển toàn bộ thế giới ngược hướng camera
    ctx.translate(-camera.x, -camera.y);

    // Vẽ nền (Lưới đất)
    ctx.strokeStyle = "#1a2635";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.width; x += WORLD.tileSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
    }
    for (let y = 0; y <= WORLD.height; y += WORLD.tileSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
    }

    // Vẽ các tảng đá (Vật cản test)
    ctx.fillStyle = "#455a64";
    rocks.forEach(rock => {
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Vẽ nhân vật
    drawPlayer();

    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Vòng linh khí
    ctx.rotate(player.angle);
    ctx.strokeStyle = "#00f2fe";
    ctx.strokeRect(-player.size/2 - 5, -player.size/2 - 5, player.size + 10, player.size + 10);
    
    // Nhân vật
    ctx.fillStyle = "white";
    ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size);
    ctx.restore();
}

function loop(time) {
    const dt = (time - (loop.last || time)) / 1000;
    loop.last = time;
    update(dt);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    requestAnimationFrame(loop);
}

// Khởi chạy
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
requestAnimationFrame(loop);
