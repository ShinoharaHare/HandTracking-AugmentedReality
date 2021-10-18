import {
    HandTracker,
    HandTrackerOptions,
    HandTrackerResult,
    InputTarget
} from './HandTracker'

import * as THREE from 'three'
import { Hands, Options, HandsConfig } from '@mediapipe/hands'

export class MediaPipeTracker extends HandTracker {
    private hands: Hands

    constructor(
        options: Partial<HandTrackerOptions> & Options,
        config?: HandsConfig
    ) {
        super(options)

        this.hands = new Hands(config)
        this.hands.setOptions(options)
    }

    public infer(target: InputTarget): Promise<HandTrackerResult> {
        return new Promise((resolve) => {
            const outputs: HandTrackerResult = {
                multiLandmarks: []
            }
            this.hands.onResults((results) => {
                results.multiHandLandmarks.forEach((landmarks) => {
                    const vectors = landmarks.map(
                        ({ x, y, z }) => new THREE.Vector3(x, y, z)
                    )
                    outputs.multiLandmarks.push(vectors)
                })
                resolve(outputs)
            })
            this.hands.send({ image: target })
        })
    }
}
