import { HandTrackerPlugin, HandTrackerResult } from '../HandTracker'
import * as THREE from 'three'
import { Landmarks } from '..'

export interface LandmarkSmootherPluginOptions {
    smoothCount: number
    smoothTolerance: number
    overwrite: boolean
}

export class LandmarkSmootherPlugin extends HandTrackerPlugin {
    smoothCount: number = 5
    smoothTolerance: number = 0.05
    overwrite: boolean = false

    private pools: Landmarks[][] = []
    private outputs: THREE.Vector3[][] = []
    private average: THREE.Vector3 = new THREE.Vector3()
    private index: number = 0

    constructor(options?: Partial<LandmarkSmootherPluginOptions>) {
        super('LandmarkSmootherPlugin')
        Object.assign(this, options)
    }

    onStart() {
        for (let i = 0; i < this.context.maxNumHands; i++) {
            this.pools[i] = []
            this.outputs[i] = []
            for (let j = 0; j < this.smoothCount; j++) {
                this.pools[i][j] = []
                for (let k = 0; k < 21; k++) {
                    this.pools[i][j][k] = new THREE.Vector3()
                    this.outputs[i][k] = new THREE.Vector3()
                }
            }
        }
    }

    onResult(result: HandTrackerResult) {
        let outputs: Landmarks[]

        if (this.overwrite) {
            outputs = result.multiLandmarks
        } else {
            result.multiSmoothLandmarks = this.outputs
            outputs = result.multiSmoothLandmarks
        }

        result.multiLandmarks.forEach((landmarks, i) => {
            const pool = this.pools[i]

            // copy every landmarks to the last pool
            landmarks.forEach((landmark, j) => {
                pool[this.index][j].copy(landmark)
            })

            // average of every landmark in the pool
            for (let j = 0; j < 21; j++) {
                this.average.set(0, 0, 0)
                pool.forEach((landmarks) => this.average.add(landmarks[j]))
                this.average.divideScalar(this.smoothCount)

                if (this.average.distanceTo(landmarks[j]) > this.smoothTolerance) {
                    outputs[i][j].copy(this.average)
                }
            }
        })

        this.index = (this.index + 1) % this.smoothCount
    }
}
