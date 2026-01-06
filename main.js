const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 1. Cấu hình
const WORLD = { width: 3000, height: 3000, baseRate: 10 };
const realms = [
    { name: "Luyện Khí", need: 100, absorb: 1, color: "#4facfe", atk: 10 },
    { name: "Trúc Cơ", need: 500, absorb: 1.5, color: "#00ff88", atk: 25 },
    { name: "Kim Đan", need: 2000, absorb: 2.5, color: "#f6d365", atk: 60 }
];

const mapImg = new Image();
mapImg.src = 'map.png'; 

// 2. Nhân vật & Quái vật
let player = {
    x: WORLD.width / 2, y: WORLD.height / 2,
    size: 36, speed: 250, linhKhi: 0, realm: 0,
    hp: 100, maxHp: 100, angle: 0, state: "idle"
};

let mobs = [];
function spawnMob() {
    if (mobs.length < 15) { // Tối đa 15 con quái trên map
        mobs.push({
            x: Math.random() * WORLD.width,
            y: Math.random() * WORLD.height,
            hp: 40 + player.realm * 50,
            maxHp: 40 + player.realm * 50,
            size: 30,
            speed: 80 + Math.random() * 50,
            color: "#ff4757"
        });
    }
}
for(let i=0; i<10; i++) spawnMob(); // Khởi tạo quái

const camera = { x: 0, y: 0 };
const keys = {};

// 3. Xử lý sự kiện
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") tryBreakthrough();
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousedown", (e) => {
    if (player.state === "move") {
        // Tấn công quái khi click
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + camera.x;
        const mouseY = e.clientY - rect.top + camera.y;

        mobs.forEach((mob, index) => {
            let d = Math.hypot(mouseX - mob.x, mouseY - mob.y);
            if (d < mob.size * 1.5) {
                mob.hp -= realms[player.realm].atk;
                if (mob.hp <= 0) {
                    mobs.splice(index, 1);
                    player.linhKhi += 20; // Thưởng khi giết quái
                    spawnMob();
                }
            }
        });
    } else {
        player.state = "cultivate";
    }
});
canvas.addEventListener("mouseup", () => { if(player.state === "cultivate") player.state = "idle"; });

// 4. Cập nhật logic
function update(dt) {
    // Di chuyển
    let dx = 0, dy = 0;
    if (keys["w"]) dy--; if (keys["s"]) dy++;
    if (keys["a"]) dx--; if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        player.x = Math.max(0, Math.min(WORLD.width, player.x + (dx/len) * player.speed * dt));
        player.y = Math.max(0, Math.min(WORLD.height, player.y + (dy/len) * player.speed * dt));
        player.state = "move";
    } else if (player.state !== "cultivate") player.state = "idle";

    // AI Quái vật đuổi người
    mobs.forEach(mob => {
        let dist = Math.hypot(player.x - mob.x, player.y - mob.y);
        if (dist < 400) { // Tầm nhìn của quái
            let mdx = (player.x - mob.x) / dist;
            let mdy = (player.y - mob.y) / dist;
            mob.x += mdx * mob.speed * dt;
            mob.y += mdy * mob.speed * dt;
            if (dist < 30) player.hp -= 10 * dt; // Quái cắn
        }
    });

    // Hồi máu nhẹ khi thiền
    if (player.state === "cultivate" && player.hp < player.maxHp) player.hp += 5 * dt;

    const realm = realms[player.realm];
    let gain = (player.state === "cultivate") ? (WORLD.baseRate * realm.absorb * 3) : (WORLD.baseRate * 0.1);
    player.linhKhi += gain * dt;
    player.angle += dt;

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    updateUI(gain, realm);
}

function updateUI(gain, realm) {
    document.getElementById("level-display").innerText = `Cảnh giới: ${realm.name}`;
    document.getElementById("spirit-count").innerText = Math.floor(player.linhKhi);
    document.getElementById("speed-tag").innerText = `Linh tốc: +${gain.toFixed(1)}/s`;
    document.getElementById("progress").style.width = Math.min((player.linhKhi/realm.need)*100, 100) + "%";
    document.getElementById("hp-bar").style.width = Math.max((player.hp / player.maxHp) * 100, 0) + "%";
    document.getElementById("state-display").innerText = "Trạng thái: " + (player.state === "move" ? "Hành tẩu" : (player.state === "cultivate" ? "Tu luyện" : "Tĩnh tọa"));
}

function tryBreakthrough() {
    const realm = realms[player.realm];
    if (realm && player.linhKhi >= realm.need) {
        player.linhKhi = 0;
        player.realm++;
        player.maxHp += 50;
        player.hp = player.maxHp;
        canvas.style.filter = "brightness(2)";
        setTimeout(() => canvas.style.filter = "brightness(1)", 150);
    }
}

// 5. Vẽ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Vẽ Map
    if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, WORLD.width, WORLD.height);
    else { ctx.fillStyle = "#1a2635"; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }

    // Vẽ Quái
    mobs.forEach(mob => {
        ctx.fillStyle = mob.color;
        ctx.beginPath();
        ctx.arc(mob.x, mob.y, mob.size, 0, Math.PI*2);
        ctx.fill();
        // Thanh máu quái
        ctx.fillStyle = "red";
        ctx.fillRect(mob.x - 15, mob.y - 40, (mob.hp/mob.maxHp)*30, 4);
    });

    // Vẽ Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.strokeStyle = realms[player.realm].color;
    ctx.lineWidth = 3;
    ctx.strokeRect(-20, -20, 40, 40);
    ctx.fillStyle = "white";
    ctx.fillRect(-18, -18, 36, 36);
    ctx.restore();

    ctx.restore();
}

function loop(time) {
    const dt = (time - (loop.last || time)) / 1000;
    loop.last = time;
    update(dt); draw();
    requestAnimationFrame(loop);
}
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
requestAnimationFrame(loop);
// ... (Giữ phần đầu: canvas, ctx, WORLD, realms, player) ...

let currentMode = "BE_QUAN"; // Chế độ mặc định

// 2. Hàm chuyển đổi thế giới
function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    // Cập nhật giao diện nút
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    if (mode === 'BE_QUAN') document.getElementById('btn-be-quan').classList.add('active');
    else document.getElementById('btn-hanh-tau').classList.add('active');

    // Hiệu ứng chuyển cảnh
    canvas.style.filter = "brightness(0)";
    setTimeout(() => {
        player.x = WORLD.width / 2;
        player.y = WORLD.height / 2;
        canvas.style.filter = "brightness(1)";
        
        // Nếu về Bế Quan thì xóa hết quái cho nhẹ máy
        if (mode === "BE_QUAN") mobs = [];
        else { for(let i=0; i<15; i++) spawnMob(); } // Sang Hành Tẩu thì tạo quái
    }, 300);
}

// 3. Logic Update (Chỉnh sửa phần tính Linh khí)
function update(dt) {
    let modeMult = (currentMode === "BE_QUAN") ? 5.0 : 1.0; // Bế quan nạp gấp 5 lần

    // Di chuyển
    let dx = 0, dy = 0;
    if (keys["w"]) dy--; if (keys["s"]) dy++;
    if (keys["a"]) dx--; if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        player.x = Math.max(0, Math.min(WORLD.width, player.x + (dx/len) * player.speed * dt));
        player.y = Math.max(0, Math.min(WORLD.height, player.y + (dy/len) * player.speed * dt));
        player.state = "move";
    } else if (player.state !== "cultivate") player.state = "idle";

    // AI Quái vật (Chỉ chạy ở chế độ Hành Tẩu)
    if (currentMode === "HANH_TAU") {
        mobs.forEach(mob => {
            let dist = Math.hypot(player.x - mob.x, player.y - mob.y);
            if (dist < 400) {
                let mdx = (player.x - mob.x) / dist;
                let mdy = (player.y - mob.y) / dist;
                mob.x += mdx * mob.speed * dt;
                mob.y += mdy * mob.speed * dt;
                if (dist < 30) player.hp -= 10 * dt;
            }
        });
    }

    // Tu luyện & Hồi máu
    const realm = realms[player.realm];
    let gain = (player.state === "cultivate") ? (WORLD.baseRate * realm.absorb * 3 * modeMult) : (WORLD.baseRate * 0.1 * modeMult);
    player.linhKhi += gain * dt;
    if (player.state === "cultivate" && player.hp < player.maxHp) player.hp += 10 * dt;

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    updateUI(gain, realm);
}

// 4. Logic Vẽ (Vẽ bản đồ khác nhau)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    if (currentMode === "HANH_TAU") {
        // Vẽ map.png khi hành tẩu
        if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, WORLD.width, WORLD.height);
        else { ctx.fillStyle = "#1a2635"; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
        
        // Vẽ quái
        mobs.forEach(mob => {
            ctx.fillStyle = mob.color;
            ctx.beginPath(); ctx.arc(mob.x, mob.y, mob.size, 0, Math.PI*2); ctx.fill();
        });
    } else {
        // Vẽ nền Động phủ khi Bế quan
        ctx.fillStyle = "#050a0f";
        ctx.fillRect(0, 0, WORLD.width, WORLD.height);
        // Vẽ trận pháp dưới chân
        ctx.strokeStyle = "#4facfe"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(WORLD.width/2, WORLD.height/2, 150, 0, Math.PI*2); ctx.stroke();
    }

    // Vẽ Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.strokeStyle = realms[player.realm].color;
    ctx.strokeRect(-20, -20, 40, 40);
    ctx.fillStyle = "white"; ctx.fillRect(-18, -18, 36, 36);
    ctx.restore();

    ctx.restore();
}

// ... (Các phần còn lại: loop, resize giữ nguyên) ...
