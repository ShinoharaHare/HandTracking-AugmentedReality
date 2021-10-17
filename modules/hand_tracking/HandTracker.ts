import { Results } from '@mediapipe/hands'

export type TrackerResult = Results
export type Callback = (result: TrackerResult) => void

export abstract class HandTracker extends EventTarget {
    private video?: HTMLVideoElement
    private callback?: Callback
    private intervalId?: number
    private lock: boolean = false

    constructor() {
        super()
    }

    abstract infer(image: HTMLVideoElement): Promise<TrackerResult>

    track(image: HTMLVideoElement, callback: (results: TrackerResult) => void) {
        this.video = image
        this.callback = callback
        this.intervalId = window.setInterval(
            () => this.lock || this.tick(),
            0
        )
    }

    stop() {
        window.clearInterval(this.intervalId)
        this.intervalId = undefined
    }

    private async tick() {
        this.lock = true
        if (this.video && this.video.currentTime && this.callback) {
            let image = await this.infer(this.video)
            this.callback(image)
        }
        this.lock = false
    }
}
