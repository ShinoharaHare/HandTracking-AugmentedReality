import {
    HandTracker,
    HandTrackerPlugin,
    HandTrackerResult
} from '../HandTracker'
import * as THREE from 'three'

interface Options {
    smoothCount: number
    smoothTolerance: number
    overwrite: boolean
}

export class LandmarkSmootherPlugin extends HandTrackerPlugin {
    smoothCount: number = 5
    smoothTolerance: number = 0.05
    overwrite: boolean = false

    private pools: THREE.Vector3[][][] = []
    private outputs: THREE.Vector3[][] = []
    private average: THREE.Vector3 = new THREE.Vector3()
    private index: number = 0

    constructor(options?: Partial<Options>) {
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

    onResults(results: HandTrackerResult[]) {
        let outputs: THREE.Vector3[][]
        if (this.overwrite) {
            outputs = results.map((result) => result.landmarks)
        } else {
            results.forEach((result, i) => {
                result.smoothLandmarks = this.outputs[i]
            })
            outputs = this.outputs
        }

        results.forEach((result, i) => {
            const pool = this.pools[i]

            result.landmarks.forEach((landmark, j) => {
                pool[this.index][j].copy(landmark)
            })

            for (let j = 0; j < 21; j++) {
                this.average.set(0, 0, 0)
                pool.forEach((landmarks) => {
                    this.average.add(landmarks[j])
                })
                this.average.divideScalar(this.smoothCount)
                if (
                    this.average.distanceTo(result.landmarks[j]) >
                    this.smoothTolerance
                ) {
                    outputs[i][j].copy(this.average)
                }
            }
        })

        this.index = (this.index + 1) % this.smoothCount
    }
}
