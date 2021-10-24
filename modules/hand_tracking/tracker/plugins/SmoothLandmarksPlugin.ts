import { HandTrackerPlugin, HandTrackerResult } from '../HandTracker'
import * as THREE from 'three'
import { Landmarks, Handedness } from '..'

export interface SmoothLandmarkPluginOptions {
    smoothCount: number
    smoothTolerance: number
}

export class SmoothLandmarkPlugin extends HandTrackerPlugin {
    smoothCount: number = 1
    smoothTolerance: number = 0.001

    private pools: Landmarks[][] = []
    private outputs: THREE.Vector3[][] = []
    private average: THREE.Vector3 = new THREE.Vector3()
    private index: number = 0

    constructor(options?: Partial<SmoothLandmarkPluginOptions>) {
        super('LandmarkSmootherPlugin')

        this.smoothCount = options?.smoothCount ?? this.smoothCount
        this.smoothTolerance = options?.smoothTolerance ?? this.smoothTolerance
    }

    onStart() {
        for (let i = 0; i < 2; i++) {
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
        if (!result.multiHandLandmarks || !result.multiHandedness) {
            return
        }
        result.multiSmoothLandmarks = this.outputs
        result.multiHandedness?.forEach((handedness, i) => {
            const poolIndex = handedness === Handedness.Left ? 0 : 1
            const pool = this.pools[poolIndex]
            const landmarks = result.multiHandLandmarks![i]

            // copy every landmarks to the last pool
            landmarks.forEach((landmark, j) => {
                pool[this.index][j].copy(landmark)
            })

            // average of every landmark in the pool
            for (let j = 0; j < 21; j++) {
                this.average.set(0, 0, 0)
                pool.forEach((landmarks) => this.average.add(landmarks[j]))
                this.average.divideScalar(this.smoothCount)

                if (this.average.distanceTo(this.outputs[i][j]) > this.smoothTolerance) {
                    this.outputs[i][j].copy(this.average)
                }
            }
        })

        this.index = (this.index + 1) % this.smoothCount
    }
}
