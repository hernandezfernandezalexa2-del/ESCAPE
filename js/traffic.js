class Traffic {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.cars = [];
        this.spawnTimer = 2;
    }

    spawn() {
        const colors = [
            "#d94b43",
            "#4284dc",
            "#dddddd",
            "#50545d",
            "#62a58b"
        ];

        this.cars.push({
            lane: Math.floor(Math.random() * 3),
            y: -120,
            color: colors[
                Math.floor(Math.random() * colors.length)
            ],
            destroyed: false
        });
    }

    getBounds(car) {
        const road = this.game.road;
        const laneWidth = road.width / 3;

        const width = Math.min(laneWidth * .52, 58);
        const height = width * 1.75;

        const x = road.x +
            laneWidth * (car.lane + .5);

        return {
            x: x - width / 2,
            y: car.y,
            width,
            height
        };
    }

    update(dt) {
        this.spawnTimer -= dt;

        if (this.spawnTimer <= 0) {
            this.spawn();

            this.spawnTimer = Math.max(
                .65,
                1.9 - this.game.speed / 210
            );
        }

        const movement =
            170 + this.game.speed * 3.7;

        for (const car of this.cars) {
            car.y += movement * dt;
        }

        const player = this.game.player.getBounds();
        const police = this.game.police.getBounds();

        for (const car of this.cars) {
            if (car.destroyed) continue;

            const b = this.getBounds(car);

            if (rectCollision(player, b)) {
                car.destroyed = true;
                this.game.crash("traffic");
                break;
            }

            if (
                !this.game.police.destroyed &&
                this.game.police.crashCooldown <= 0 &&
                rectCollision(police, b)
            ) {
                car.destroyed = true;
                this.game.police.hitTraffic(car);
            }
        }

        this.cars = this.cars.filter(car =>
            !car.destroyed &&
            car.y < this.game.height + 150
        );
    }

    draw(ctx) {
        for (const car of this.cars) {
            const b = this.getBounds(car);

            drawCar(
                ctx, b.x, b.y,
                b.width, b.height,
                car.color, false
            );
        }
    }
}