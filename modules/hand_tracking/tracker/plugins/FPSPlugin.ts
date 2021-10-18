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
    options: FPSPluginOptions = {
        maxPoolSize: 100
    }
    private lastUpdate: number = 0
    private pool: number[] = []
    
    constructor(options?: Partial<FPSPluginOptions>) {
        super()
        Object.assign(this.options, options)
    }

    onStart() {  
        this.lastUpdate = performance.now()
    }

    onResult(result: HandTrackerResult) {
        const now = performance.now()
        const delta = now - this.lastUpdate
        const fps = 1000 / delta

        this.pool.push(fps)
        if (this.pool.length > this.options.maxPoolSize) {
            this.pool.shift()
        }

        result.fps = {
            current: fps,
            min: Math.min(...this.pool),
            max: Math.max(...this.pool),
            average: this.pool.reduce((a, b) => a + b, 0) / this.pool.length
        }

        this.lastUpdate = now
    }
}