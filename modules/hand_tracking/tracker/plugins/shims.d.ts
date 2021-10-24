import { FPSData } from './FPSPlugin'
// import { HandAngles } from './MediaPipe3DAnglePlugin'

declare module '../HandTracker' {
    interface HandTrackerResult {
        multiHandedness?: Handedness[]
        multiSmoothLandmarks?: Landmarks[]
        // multiHandAngles?: HandAngles[]
        multiHandAngles?: Float32Array[]
        fps?: FPSData
    }
}
