
declare module '../HandTracker' {
    interface HandTrackerResult {
        multiSmoothLandmarks?: Landmarks[]
        multiAngles?: Float32Array[]
    }
