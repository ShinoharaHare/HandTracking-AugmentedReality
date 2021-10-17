import { NormalizedLandmark } from '@mediapipe/hands'
import { Vector3 } from 'three'
import { Finger, Knucle } from './types'
import { AngleData } from './AngleData'

export class MP3DEstimator {
    private vectors: Vector3[] = Array.from({ length: 21 }, () => new Vector3())
    private v1: Vector3 = new Vector3()
    private v2: Vector3 = new Vector3()

    constructor() {
        // super();
    }

    private calculateThumbProximalAngle(): number {
        let angle = 0
        return angle
    }

    private calculateFingerProximalAngle(finger: Finger): number {
        let idx = finger * 4 + 1
        this.v1.subVectors(this.vectors[idx], this.vectors[0])
        this.v2.subVectors(this.vectors[idx + 1], this.vectors[idx])
        let angle = this.v1.angleTo(this.v2)
        return angle
    }

    private calculateFingerAngle(finger: Finger, knuckle: Knucle): number {
        if (finger === Finger.Thumb && knuckle === Knucle.Proximal) {
            return this.calculateThumbProximalAngle()
        } else if (knuckle === Knucle.Proximal) {
            return this.calculateFingerProximalAngle(finger)
        } else {
            let idx = finger * 4 + knuckle
            this.v1.subVectors(this.vectors[idx + 1], this.vectors[idx])
            this.v2.subVectors(this.vectors[idx + 2], this.vectors[idx + 1])
            let angle = this.v1.angleTo(this.v2)
            return angle
        }
    }

    update(landmarks: NormalizedLandmark[]) {
        landmarks.forEach(({ x, y, z }, index) => {
            this.vectors[index].set(x, y, z)
        })
    }

    getAngles(target?: AngleData): AngleData {
        target = target || new AngleData()

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                target.set(i, j, this.calculateFingerAngle(i, j))
            }
        }

        return target
    }

    estimateAngles2(
        landmarks: NormalizedLandmark[],
        target?: Float32Array
    ): Float32Array {
        target = target || new Float32Array(5)

        this.v1.subVectors(this.vectors[1], this.vectors[0])
        this.v2.subVectors(this.vectors[2], this.vectors[1])
        target[0] = this.v1.angleTo(this.v2) - 1.3
        // angle5[0] = (this.v1.angleTo(this.v2)) * 2;

        this.v1.subVectors(this.vectors[10], this.vectors[9])
        this.v2.subVectors(this.vectors[6], this.vectors[5])
        target[1] = -this.v1.angleTo(this.v2)

        target[2] = 0

        this.v2.subVectors(this.vectors[14], this.vectors[13])
        target[3] = this.v1.angleTo(this.v2)

        this.v2.subVectors(this.vectors[18], this.vectors[17])
        target[4] = this.v1.angleTo(this.v2)

        return target
    }
}
