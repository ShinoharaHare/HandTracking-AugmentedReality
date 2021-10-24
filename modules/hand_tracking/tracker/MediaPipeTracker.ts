import { HandTracker, HandTrackerOptions, HandTrackerResult, InputTarget } from './HandTracker'

import * as THREE from 'three'
import { Hands, Options, HandsConfig } from '@mediapipe/hands'
import { Landmarks } from './'

export class MediaPipeTracker extends HandTracker {
    private hands: Hands
    private buffer: Landmarks[]

    constructor(
        target: InputTarget,
        options?: Partial<HandTrackerOptions & Options>,
        config?: HandsConfig
    ) {
        super(target, options)

        this.hands = new Hands(config)
        console.log(this.hands, options)
        this.hands.setOptions(options ?? {})

        this.buffer = []
        for (let i = 0; i < this.maxNumHands; i++) {
            this.buffer.push([])
            for (let j = 0; j < 21; j++) {
                this.buffer[i].push(new THREE.Vector3())
            }
        }
    }

    public infer(target: InputTarget): Promise<HandTrackerResult> {
        return new Promise((resolve) => {
            this.hands.onResults((results) => {
                const outputs: HandTrackerResult & any = {
                    mediapipeResults: results,
                    multiHandLandmarks: []
                }
                
                if (results.multiHandLandmarks?.length) {
                    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                        for (let j = 0; j < results.multiHandLandmarks[i].length; j++) {
                            this.buffer[i][j].x = results.multiHandLandmarks[i][j].x
                            this.buffer[i][j].y = results.multiHandLandmarks[i][j].y
                            this.buffer[i][j].z = results.multiHandLandmarks[i][j].z
                        }
                        outputs.multiHandLandmarks[i] = this.buffer[i]
                    }
                }

                resolve(outputs)
            })
            this.hands.send({ image: target })
        })
    }
}
