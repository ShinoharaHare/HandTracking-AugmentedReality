import * as THREE from 'three'

export type InputTarget = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement

export type Landmarks = THREE.Vector3[]

export enum Handedness {
    Left = 0,
    Right = 1
}

export interface HandTrackerResult {
    multiHandLandmarks?: Landmarks[]
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export abstract class HandTrackerPlugin {
    private internalContext!: HandTracker
    get context(): HandTracker {
        return this.internalContext
    }

    readonly name: string

    constructor(name?: string) {
        this.name = name || this.constructor.name
    }

    onAdd(context: HandTracker) {
        this.internalContext = context
    }

    abstract onStart(): void
    abstract onResult(result: HandTrackerResult): void
}

class HandTrackerResultEvent extends Event {
    constructor(public result: HandTrackerResult) {
        super('result')
    }
}

export interface HandTrackerOptions {
    minInterval: number
    maxNumHands: 1 | 2
    plugins: HandTrackerPlugin[]
}

export abstract class HandTracker extends EventTarget {
    private plugins: Map<string, HandTrackerPlugin> = new Map()
    private stopFlag: boolean = false
    private runningPromise?: Promise<void>

    minInterval: number = 1 / 3000
    maxNumHands: 1 | 2 = 1

    get running() {
        return this.runningPromise !== undefined
    }

    constructor(readonly target: InputTarget, options?: Partial<HandTrackerOptions>) {
        super()

        options?.plugins?.forEach((plugin) => this.addPlugin(plugin))
        this.maxNumHands = options?.maxNumHands ?? this.maxNumHands
        this.minInterval = options?.minInterval ?? this.minInterval
    }

    abstract infer(image: InputTarget): Promise<HandTrackerResult>

    addPlugin(plugin: HandTrackerPlugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name ${plugin.name} already exists`)
        }
        plugin.onAdd(this)
        this.plugins.set(plugin.name, plugin)
    }

    deletePlugin(pluginName: string) {
        this.plugins.delete(pluginName)
    }

    getPlugin<T extends HandTrackerPlugin>(pluginName: string) {
        return this.plugins.get(pluginName) as T
    }

    start(): Promise<void> {
        this.plugins.forEach((plugin) => plugin.onStart())

        this.runningPromise = new Promise(async (resolve) => {
            if (!this.target) {
                return
            }

            for (;;) {
                if (this.stopFlag) {
                    this.stopFlag = false
                    break
                }

                const lastTime = performance.now()

                if (this.target instanceof HTMLVideoElement && this.target.currentTime <= 0) {
                    await wait(this.minInterval)
                    continue
                }

                const result = await this.infer(this.target)

                this.plugins.forEach((plugin) => {
                    plugin.onResult(result)
                })

                this.dispatchEvent(new HandTrackerResultEvent(result))

                const passedTime = performance.now() - lastTime

                await wait(Math.max(0, this.minInterval - passedTime))
            }

            resolve()
        })

        return this.runningPromise
    }

    stop() {
        this.stopFlag = true
        return this.runningPromise
    }

    onResults(callback: (result: HandTrackerResult) => void) {
        this.addEventListener('result', (e: unknown) => {
            const envent = e as HandTrackerResultEvent
            callback(envent.result)
        })
    }
}
