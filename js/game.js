const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function rectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function drawCar(ctx, x, y, w, h, color, police = false) {
    ctx.save();

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 7, w, h, 10);
    ctx.fill();

    // Llantas
    ctx.fillStyle = "#090909";
    ctx.fillRect(x - 5, y + h * .18, 7, h * .22);
    ctx.fillRect(x + w - 2, y + h * .18, 7, h * .22);
    ctx.fillRect(x - 5, y + h * .65, 7, h * .22);
    ctx.fillRect(x + w - 2, y + h * .65, 7, h * .22);

    // Carrocería
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, w * .2);
    ctx.fill();

    // Parabrisas
    ctx.fillStyle = "#142735";
    ctx.beginPath();
    ctx.roundRect(
        x + w * .12,
        y + h * .19,
        w * .76,
        h * .24,
        5
    );
    ctx.fill();

    // Cristal trasero
    ctx.fillStyle = "#182632";
    ctx.beginPath();
    ctx.roundRect(
        x + w * .13,
        y + h * .66,
        w * .74,
        h * .15,
        4
    );
    ctx.fill();

    // Luces delanteras
    ctx.fillStyle = "#fff9d6";
    ctx.fillRect(x + 4, y + 5, w * .22, 5);
    ctx.fillRect(x + w * .74, y + 5, w * .22, 5);

    // Luces traseras
    ctx.fillStyle = "#ff3535";
    ctx.fillRect(x + 4, y + h - 9, w * .22, 5);
    ctx.fillRect(x + w * .74, y + h - 9, w * .22, 5);

    if (police) {
        ctx.fillStyle = "#17191e";
        ctx.fillRect(
            x + w * .08,
            y + h * .46,
            w * .84,
            12
        );
    }

    ctx.restore();
}

class Game {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.running = false;
        this.crashing = false;

        this.speed = 15;
        this.distance = 0;
        this.roadOffset = 0;

        this.shake = 0;
        this.flash = 0;
        this.particles = [];
        this.crashTimer = 0;

        this.road = { x: 0, width: 0 };

        this.player = new Player(this);
        this.police = new Police(this);
        this.traffic = new Traffic(this);

        this.lastTime = 0;

        this.resize();
        this.bindEvents();

        window.addEventListener(
            "resize", () => this.resize()
        );

        requestAnimationFrame(t => this.loop(t));
    }

    resize() {
        const container =
            document.getElementById("gameContainer");

        const dpr = Math.min(
            window.devicePixelRatio || 1, 2
        );

        this.width = container.clientWidth;
        this.height = container.clientHeight;

        canvas.width = Math.round(this.width * dpr);
        canvas.height = Math.round(this.height * dpr);

        canvas.style.width = this.width + "px";
        canvas.style.height = this.height + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.road.width = Math.min(
            this.width * .94, 520
        );

        this.road.x =
            (this.width - this.road.width) / 2;
    }

    bindEvents() {
        document.getElementById("startButton")
            .addEventListener("click", () => this.start());

        document.getElementById("restartButton")
            .addEventListener("click", () => this.start());

        // Toda la pantalla funciona como control.
        canvas.addEventListener("pointerdown", event => {
            if (!this.running) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;

            this.player.move(
                x < rect.width / 2 ? -1 : 1
            );
        });

        window.addEventListener("keydown", event => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                this.player.move(-1);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                this.player.move(1);
            }
        });
    }

    start() {
        this.running = true;
        this.crashing = false;

        this.speed = 45;
        this.distance = 0;
        this.roadOffset = 0;

        this.shake = 0;
        this.flash = 0;
        this.crashTimer = 0;
        this.particles = [];

        this.player.reset();
        this.police.reset();
        this.traffic.reset();

        document.getElementById("speed").textContent = "45";
        document.getElementById("distance").textContent = "0";

        document.getElementById("startScreen")
            .classList.add("hidden");

        document.getElementById("gameOverScreen")
            .classList.add("hidden");
    }

    crash(reason) {
        if (!this.running || this.crashing) return;

        this.running = false;
        this.crashing = true;
        this.crashTimer = .8;

        this.shake = 18;
        this.flash = .8;

        const b = this.player.getBounds();

        this.addExplosion(b, "#ff9d22");
    }

    endGame() {
        this.running = false;
        this.crashing = false;

        document.getElementById("finalDistance")
            .textContent = Math.floor(this.distance);

        document.getElementById("gameOverScreen")
            .classList.remove("hidden");
    }

    addExplosion(bounds, color) {
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;

        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 260;

            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: .35 + Math.random() * .5,
                maxLife: .85,
                size: 2 + Math.random() * 6,
                color
            });
        }
    }

    update(dt) {
        if (this.running) {
            // Aceleración progresiva perceptible.
            const acceleration = 1.2 + this.distance * 0.0025;

            this.speed = Math.min(
                300,
                this.speed + dt * acceleration
            );

            this.distance +=
                (this.speed / 3.6) * dt;

            this.roadOffset +=
                (200 + this.speed * 5) * dt;

            this.player.update(dt);
            this.police.update(dt);

            if (this.running) {
                this.traffic.update(dt);
            }

            document.getElementById("speed")
                .textContent = Math.floor(this.speed);

            document.getElementById("distance")
                .textContent = Math.floor(this.distance);
        }

        if (this.crashing) {
            this.crashTimer -= dt;

            if (this.crashTimer <= 0) {
                this.endGame();
            }
        }

        this.shake = Math.max(0, this.shake - dt * 30);
        this.flash = Math.max(0, this.flash - dt * 2);

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= Math.max(0, 1 - dt * 3);
            p.vy *= Math.max(0, 1 - dt * 3);
            p.life -= dt;
        }

        this.particles = this.particles.filter(
            p => p.life > 0
        );
    }

    drawRoad() {
        ctx.fillStyle = "#142019";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#303238";
        ctx.fillRect(
            this.road.x, 0,
            this.road.width, this.height
        );

        const laneWidth = this.road.width / 3;

        ctx.fillStyle = "#eeeeee";

        ctx.fillRect(this.road.x + 5, 0, 3, this.height);
        ctx.fillRect(
            this.road.x + this.road.width - 8,
            0, 3, this.height
        );

        const dash = 48;
        const period = 90;
        const offset = this.roadOffset % period;

        for (let lane = 1; lane <= 2; lane++) {
            const x = this.road.x + laneWidth * lane;

            for (
                let y = -period + offset;
                y < this.height;
                y += period
            ) {
                ctx.fillRect(x - 2, y, 4, dash);
            }
        }
    }

    draw() {
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();

        if (this.shake > 0) {
            ctx.translate(
                (Math.random() - .5) * this.shake,
                (Math.random() - .5) * this.shake
            );
        }

        /* CÁMARA ALEJADA */

        ctx.save();

        const zoom = 0.72;

        // Mantener el mundo centrado
        ctx.translate(
            this.width / 2,
            this.height * 0.42
        );

        ctx.scale(zoom, zoom);

        ctx.translate(
            -this.width / 2,
            -this.height * 0.42
        );

        this.drawRoad();
        this.traffic.draw(ctx);
        this.police.draw(ctx);
        this.player.draw(ctx);

        ctx.restore();

        for (const p of this.particles) {
            ctx.globalAlpha = Math.min(
                1, p.life / .35
            );

            ctx.fillStyle = p.color;
            ctx.fillRect(
                p.x, p.y, p.size, p.size
            );
        }

        ctx.globalAlpha = 1;
        ctx.restore();

        if (this.flash > 0) {
            ctx.fillStyle =
                `rgba(255,65,25,${this.flash * .45})`;

            ctx.fillRect(
                0, 0, this.width, this.height
            );
        }
    }

    loop(time) {
        const dt = Math.min(
            (time - this.lastTime) / 1000 || 0,
            .05
        );

        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }
}

const game = new Game();