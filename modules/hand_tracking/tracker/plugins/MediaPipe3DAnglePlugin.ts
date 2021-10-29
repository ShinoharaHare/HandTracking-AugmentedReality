import * as THREE from 'three'
import { Landmarks } from '~/modules/hand_tracking'
import { HandTrackerPlugin, HandTrackerResult } from '..'

enum Finger {
    Thumb,
    Index,
    Middle,
    Ring,
    Pinky
}

enum Knucle {
    Proximal,
    Intermediate,
    Distal
}

export interface MediaPipe3DAnglePluginOptions {
    multiHandlandmarksPropertyName: string
}

export class MediaPipe3DAnglePlugin extends HandTrackerPlugin {
    private v1: THREE.Vector3 = new THREE.Vector3()
    private v2: THREE.Vector3 = new THREE.Vector3()
    private buffer: Float32Array[] = []

    multiHandlandmarksPropertyName: string = 'multiHandLandmarks'

    constructor(options?: Partial<MediaPipe3DAnglePluginOptions>) {
        super('MediaPipe3DAnglePlugin')

        this.multiHandlandmarksPropertyName =
            options?.multiHandlandmarksPropertyName ?? this.multiHandlandmarksPropertyName
    }

    private calculateThumbProximalAngle(landmarks: THREE.Vector3[]): number {
        let angle = 0
        return angle
    }

    private calculateFingerProximalAngle(landmarks: THREE.Vector3[], finger: Finger): number {
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

    private calculateAngleBetweenFingers(landmarks: THREE.Vector3[]): number[] {
        const angles: number[] = [0, 0, 0, 0, 0]

        this.v1.subVectors(landmarks[1], landmarks[0])
        this.v2.subVectors(landmarks[2], landmarks[1])
        angles[0] = this.v1.angleTo(this.v2) // angle between thumb and index finger

        this.v1.addVectors(landmarks[17], landmarks[5])
        this.v1.divideScalar(2)
        this.v1.sub(landmarks[0])
        
        this.v1.subVectors(landmarks[6], landmarks[5])
        this.v2.subVectors(landmarks[9], landmarks[0])
        angles[1] = -this.v1.angleTo(this.v2) + THREE.MathUtils.degToRad(3) // index

        this.v1.subVectors(landmarks[10], landmarks[9])
        this.v2.subVectors(landmarks[13], landmarks[0])
        angles[2] = -this.v1.angleTo(this.v2) + THREE.MathUtils.degToRad(3) // middle

        this.v1.subVectors(landmarks[14], landmarks[13])
        this.v2.subVectors(landmarks[17], landmarks[0])
        angles[3] = -this.v1.angleTo(this.v2) + THREE.MathUtils.degToRad(10) // ring

        this.v1.subVectors(landmarks[18], landmarks[17])
        this.v2.subVectors(landmarks[13], landmarks[0])
        angles[4] = this.v1.angleTo(this.v2) + THREE.MathUtils.degToRad(-15) // pinky

        return angles
    }

    onStart(): void {
        this.buffer = []
        for (let i = 0; i < this.context.maxNumHands; i++) {
            this.buffer[i] = new Float32Array(20)
        }
    }

    onResult(result: HandTrackerResult): void {
        const multiHandLandmarks: Landmarks[] = (result as any)[this.multiHandlandmarksPropertyName]

        if (multiHandLandmarks) {
            result.multiHandAngles = []
            for (let i = 0; i < multiHandLandmarks.length; i++) {
                const landmarks = multiHandLandmarks[i]
                for (let j = 0; j < 5; j++) {
                    for (let k = 0; k < 3; k++) {
                        this.buffer[i][j * 3 + k] = this.calculateFingerAngle(landmarks, j, k)
                    }
                }

                const angles = this.calculateAngleBetweenFingers(landmarks)
                for (let j = 0; j < 5; j++) {
                    this.buffer[i][j + 15] = angles[j]
                }
                result.multiHandAngles![i] = this.buffer[i]
            }
        }
    }
}
