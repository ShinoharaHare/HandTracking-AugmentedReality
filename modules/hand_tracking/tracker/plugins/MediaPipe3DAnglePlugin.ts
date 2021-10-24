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

    onStart(): void {}

    onResult(result: HandTrackerResult): void {
        result.multiHandAngles = []
        const multiHandLandmarks: Landmarks[] = (result as any)[this.multiHandlandmarksPropertyName]

        if (multiHandLandmarks) {
            for (let i = 0; i < multiHandLandmarks.length; i++) {
                const landmarks = multiHandLandmarks[i]
                result.multiHandAngles![i] = new Float32Array(15)
                for (let j = 0; j < 5; j++) {
                    for (let k = 0; k < 3; k++) {
                        result.multiHandAngles![i][j * 3 + k] = this.calculateFingerAngle(
                            landmarks,
                            j,
                            k
                        )
                    }
                }
            }
        }
    }
}
