import { FPSData } from './FPSPlugin'

declare module '../HandTracker' {
    interface HandTrackerResult {
        multiSmoothLandmarks?: Landmarks[]
        multiAngles?: Float32Array[]
        fps?: FPSData
    }
}
