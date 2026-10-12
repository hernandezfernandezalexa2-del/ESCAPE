class Police {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.lane = 1;
        this.visualLane = 1;
        this.distance = 420;
        this.flashTime = 0;
        this.decisionTimer = 1.4;
        this.crashCooldown = 0;
        this.crashCount = 0;
        this.destroyed = false;
        this.respawnTimer = 0;
    }

    update(dt) {
        if (this.destroyed) {
            this.respawnTimer -= dt;

            if (this.respawnTimer <= 0) {
                this.destroyed = false;

                this.distance = 420;

                this.lane = Math.floor(
                    Math.random() * 3
                );

                this.visualLane = this.lane;

                this.decisionTimer = 1.2;
                this.crashCooldown = 1.5;
            }

            return;
        }
        this.flashTime += dt;

        this.crashCooldown = Math.max(
            0, this.crashCooldown - dt
        );

        this.decisionTimer -= dt;

        if (this.decisionTimer <= 0) {
            this.makeDecision();
            this.decisionTimer =
                .55 + Math.random() * .65;
        }

        this.visualLane +=
            (this.lane - this.visualLane) *
            Math.min(1, dt * 3.2);

        // La patrulla se acerca lentamente.
        const closingSpeed =
            0.8 + Math.max(0, this.game.speed - 15) * 0.025;

        this.distance -= closingSpeed * dt;

        if (this.distance <= 0) {
            this.distance = 0;
            this.game.crash("police");
        }
    }

    makeDecision() {
        const game = this.game;
        const targetLane = game.player.lane;

        const currentBounds = this.getBounds();

        const danger = game.traffic.cars.some(car => {
            const b = game.traffic.getBounds(car);

            return car.lane === this.lane &&
                b.y + b.height > currentBounds.y - 85 &&
                b.y < currentBounds.y + 110;
        });

        const options = [0, 1, 2].filter(lane => {
            return !game.traffic.cars.some(car => {
                const b = game.traffic.getBounds(car);

                return car.lane === lane &&
                    b.y + b.height > currentBounds.y - 100 &&
                    b.y < currentBounds.y + 110;
            });
        });

        if (danger && options.length) {
            options.sort((a, b) =>
                Math.abs(a - targetLane) -
                Math.abs(b - targetLane)
            );

            this.lane = options[0];
            return;
        }

        // No siempre sigue al jugador.
        if (Math.random() < .55) {
            const direction =
                Math.sign(targetLane - this.lane);

            const next = this.lane + direction;

            if (options.includes(next)) {
                this.lane = next;
            }
        }
    }

    getBounds() {
        const road = this.game.road;
        const laneWidth = road.width / 3;
        const width = Math.min(laneWidth * .54, 60);
        const height = width * 1.75;

        const player = this.game.player.getBounds();

        const visibleGap = Math.min(
            this.game.height * .60,
            75 + this.distance * 1.15
        );

        const centerY =
            player.y + player.height / 2 +
            visibleGap;

        const x = road.x +
            laneWidth * (this.visualLane + .5);

        return {
            x: x - width / 2,
            y: centerY - height / 2,
            width,
            height
        };
    }

    hitTraffic(car) {
        if (this.destroyed || this.crashCooldown > 0) {
            return;
        }

        this.destroyed = true;
        this.respawnTimer = 2.5;
        this.crashCooldown = 2.5;

        // Explosión en la posición de la patrulla
        this.game.addExplosion(
            this.getBounds(),
            "#ff6633"
        );

        this.game.shake = 12;

        // La siguiente patrulla comenzará lejos
        this.distance = 420;
    }

    draw(ctx) {
        if (this.destroyed) return;
        const b = this.getBounds();

        drawCar(
            ctx, b.x, b.y,
            b.width, b.height,
            "#f1f2f5", true
        );

        const pulse = Math.sin(this.flashTime * 19);
        const red = pulse > 0;

        const lightY = b.y + b.height * .47;

        ctx.save();

        ctx.shadowBlur = 24;
        ctx.shadowColor = red ? "#ff2020" : "#2080ff";

        ctx.fillStyle = red ? "#ff2020" : "#2080ff";

        ctx.fillRect(
            b.x + b.width * .1,
            lightY,
            b.width * .38,
            9
        );

        ctx.fillStyle = red ? "#2080ff" : "#ff2020";
        ctx.shadowColor = ctx.fillStyle;

        ctx.fillRect(
            b.x + b.width * .52,
            lightY,
            b.width * .38,
            9
        );

        ctx.restore();
    }
}