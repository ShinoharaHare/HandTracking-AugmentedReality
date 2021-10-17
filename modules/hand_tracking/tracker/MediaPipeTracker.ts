import {
    HandTracker,
    HandTrackerOptions,
    HandTrackerResults,
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

    public infer(target: InputTarget): Promise<HandTrackerResults> {
        return new Promise((resolve) => {
            const outputs: HandTrackerResults = []
            this.hands.onResults((results) => {
                results.multiHandLandmarks.forEach((landmarks, i) => {
                    outputs[i] = { landmarks: [] }
                    landmarks.forEach((landmark, j) => {
                        outputs[i].landmarks[j] = new THREE.Vector3(
                            landmark.x,
                            landmark.y,
                            landmark.z
                        )
                    })
                })
                resolve(outputs)
            })
            this.hands.send({ image: target })
        })
    }
}
