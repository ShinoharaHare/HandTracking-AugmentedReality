import { HandTrackerResult } from '../HandTracker'

declare module '../HandTracker' {
    interface HandTrackerResult {
        smoothLandmarks?: THREE.Vector3[]
        angles?: Float32Array
    }
}