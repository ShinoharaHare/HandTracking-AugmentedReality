import * as THREE from 'three'

export interface HandTrackerResult {
    landmarks: THREE.Vector3[]
}

export type HandTrackerResults = HandTrackerResult[]

export type InputTarget =
    | HTMLVideoElement
    | HTMLImageElement
    | HTMLCanvasElement

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export abstract class HandTrackerPlugin {
    readonly name: string
    context!: HandTracker
    constructor(name?: string) {
        this.name = name || this.constructor.name
    }

    onInit(context: HandTracker) {
        this.context = context
        this.onStart()
    }

    abstract onStart(): void
    abstract onResults(results: HandTrackerResults): void
}

class HandTrackerResultEvent extends Event {
    constructor(public results: HandTrackerResults) {
        super('result')
    }
}

export interface HandTrackerOptions {
    target: InputTarget
    minInterval: number
    maxNumHands: number
    plugins: HandTrackerPlugin[]
}

export abstract class HandTracker extends EventTarget {
    private plugins: Map<string, HandTrackerPlugin> = new Map()
    private stopFlag: boolean = false
    private runningPromise?: Promise<void>
    target?: InputTarget
    readonly minInterval: number = 1 / 3000
    readonly maxNumHands = 1

    get running() {
        return this.runningPromise !== undefined
    }

    constructor(options?: Partial<HandTrackerOptions>) {
        super()

        if (options?.plugins) {
            options.plugins.forEach((plugin) => this.addPlugin(plugin))
            delete options.plugins
        }
        Object.assign(this, options)
    }

    abstract infer(image: InputTarget): Promise<HandTrackerResults>

    addPlugin(plugin: HandTrackerPlugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name ${plugin.name} already exists`)
        }
        this.plugins.set(plugin.name, plugin)
    }

    deletePlugin(pluginName: string) {
        this.plugins.delete(pluginName)
    }

    getPlugin<T extends HandTrackerPlugin>(pluginName: string) {
        return this.plugins.get(pluginName) as T
    }

    start(): Promise<void> {
        this.plugins.forEach((plugin) => plugin.onInit(this))

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

                if (
                    this.target instanceof HTMLVideoElement &&
                    this.target.currentTime <= 0
                ) {
                    await wait(this.minInterval)
                    continue
                }

                const result = await this.infer(this.target)

                this.plugins.forEach((plugin) => {
                    plugin.onResults(result)
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

    onResults(callback: (event: HandTrackerResultEvent) => void) {
        this.addEventListener('result', callback as any)
    }
}
