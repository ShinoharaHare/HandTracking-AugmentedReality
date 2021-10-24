import { HandTrackerPlugin, HandTrackerResult } from '..'

export interface FPSData {
    max: number
    min: number
    current: number
    average: number
}

export interface FPSPluginOptions {
    maxPoolSize: number
}

export class FPSPlugin extends HandTrackerPlugin {
    readonly maxPoolSize: number = 100

    private lastUpdateTime!: number
    private pool!: Float32Array
    private poolIndex!: number
    private poolSize!: number

    constructor(options?: Partial<FPSPluginOptions>) {
        super()
        this.maxPoolSize = options?.maxPoolSize ?? this.maxPoolSize
    }

    onStart() {
        this.lastUpdateTime = performance.now()
        this.pool = new Float32Array(this.maxPoolSize)
        this.poolIndex = 0
        this.poolSize = 0
    }

    onResult(result: HandTrackerResult) {
        const now = performance.now()
        const delta = now - this.lastUpdateTime
        const fps = 1000 / delta

        this.pool[this.poolIndex++] = fps
        this.poolSize = Math.min(this.poolSize + 1, this.maxPoolSize)

        result.fps = {
            current: fps,
            min: Math.min(...this.pool),
            max: Math.max(...this.pool),
            average: this.pool.reduce((a, b) => a + b, 0) / this.poolSize
        }

        this.poolIndex %= this.maxPoolSize
        this.lastUpdateTime = now
    }
}
