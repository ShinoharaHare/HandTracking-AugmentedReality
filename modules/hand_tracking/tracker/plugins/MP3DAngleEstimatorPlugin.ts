import * as THREE from 'three'
import { HandTrackerPlugin, HandTrackerResults } from '..'
import { Finger, Knucle } from '../..'

export class MP3DAngleEstimatorPlugin extends HandTrackerPlugin {
    private v1: THREE.Vector3 = new THREE.Vector3()
    private v2: THREE.Vector3 = new THREE.Vector3()

    constructor() {
        super()
    }

    private calculateThumbProximalAngle(landmarks: THREE.Vector3[]): number {
        let angle = 0
        return angle
    }

    private calculateFingerProximalAngle(
        landmarks: THREE.Vector3[],
        finger: Finger
    ): number {
        let idx = finger * 4 + 1
        this.v1.subVectors(landmarks[idx], landmarks[0])
        this.v2.subVectors(landmarks[idx + 1], landmarks[idx])
        let angle = this.v1.angleTo(this.v2)
        return angle
    }

    private calculateFingerAngle(
        landmarks: THREE.Vector3[],
        finger: Finger,
        knuckle: Knucle
    ): number {
        if (finger === Finger.Thumb && knuckle === Knucle.Proximal) {
            return this.calculateThumbProximalAngle(landmarks)
        } else if (knuckle === Knucle.Proximal) {
            return this.calculateFingerProximalAngle(landmarks, finger)
        } else {
            let idx = finger * 4 + knuckle
            this.v1.subVectors(landmarks[idx + 1], landmarks[idx])
            this.v2.subVectors(landmarks[idx + 2], landmarks[idx + 1])
            let angle = this.v1.angleTo(this.v2)
            return angle
        }
    }

    onStart(): void {}

    onResults(results: HandTrackerResults): void {
        results.forEach((result) => {
            result.angles = new Float32Array(15)
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 3; j++) {
                    result.angles[i * 3 + j] = this.calculateFingerAngle(result.landmarks, i, j)
                }
            }
        })
    }
}
