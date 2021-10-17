export class FPS {
    private index: number = 0;
    private lastTime: number = 0;

    private pool: number[] = [];
    private readonly maxCnt = 100;

    public min: number = Infinity;
    public max: number = -Infinity;
    
    constructor() {}

    get fps() {
        if(this.lastTime === 0) {
            this.lastTime = Date.now();
            return 0;
        }
        let now = Date.now();
        let fps = 1/ (now - this.lastTime) * 1000;
        this.lastTime = now;

        if(fps > this.max) {
            this.max = fps;
        }else if(fps < this.min) {
            this.min = fps;
        }

        return fps; 
    }

    get afps() {
        if(this.lastTime === 0) {
            this.lastTime = Date.now();
            return 0;
        }
        let now = Date.now();
        this.pool[this.index++] = (now - this.lastTime);
        this.lastTime = now;
        this.index %= this.maxCnt;
        let sum = this.pool.reduce((sum, value) =>  sum + value );
        return 1/ (sum / this.pool.length) * 1000;
    }
}