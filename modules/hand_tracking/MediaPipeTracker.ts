import { HandTracker, TrackerResult } from './HandTracker'

import { Hands, Options, HandsConfig, Results } from '@mediapipe/hands'

export class MediaPipeTracker extends HandTracker {
    private hands: Hands
    private queue: Function[] = []

    constructor(options: Options, config?: HandsConfig) {
        super()
        this.hands = new Hands(config)
        this.hands.setOptions(options)
        this.hands.onResults((x) => this.onResults(x))
    }

    private onResults(results: Results) {
        // const { multiHandLandmarks, multiHandedness } = results;
        // if (multiHandedness && multiHandLandmarks) {
        //     for (let i = 0; i < multiHandedness.length; i++) {
        //         let landmarks = multiHandLandmarks[i]
        //         let handness = multiHandedness[i].label
        //         let x = new LandmarkHelper(landmarks, handness)
        //         result.push(x)
        //     }
        // }
        const resolve = this.queue.shift()
        resolve?.(results)
    }

    public initialize() {
        return this.hands.initialize()
    }

    public async infer(image: HTMLVideoElement | HTMLImageElement): Promise<TrackerResult> {
        this.hands.send({ image })
        let result = await new Promise<TrackerResult>((resolve) =>
            this.queue.push(resolve)
        )
        return result
    }
}
