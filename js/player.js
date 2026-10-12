class Player {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.lane = 1;
        this.visualLane = 1;
    }

    move(direction) {
        if (!this.game.running) return;

        this.lane = Math.max(
            0,
            Math.min(2, this.lane + direction)
        );
    }

    update(dt) {
        this.visualLane +=
            (this.lane - this.visualLane) *
            Math.min(1, dt * 13);
    }

    getBounds() {
        const road = this.game.road;
        const laneWidth = road.width / 3;
        const width = Math.min(laneWidth * .52, 58);
        const height = width * 1.75;

        const x = road.x +
            laneWidth * (this.visualLane + .5);

        const y = this.game.height * .43;

        return {
            x: x - width / 2,
            y: y - height / 2,
            width,
            height
        };
    }

    draw(ctx) {
        const b = this.getBounds();

        drawCar(
            ctx, b.x, b.y,
            b.width, b.height,
            "#f4cc29", false
        );
    }
}