function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export class CalibrationData {
    readonly limits = {
        min: new Float32Array(20).fill(Infinity),
        max: new Float32Array(20).fill(-Infinity)
    }

    public getThresholds(ratio: number) {
        const thresholds = new Float32Array(15)
        for (let i = 0; i < 15; i++) {
            thresholds[i] = this.limits.max[i] * ratio + this.limits.min[i] * (1 - ratio)
        }
        return thresholds
    }

    // public map
}

export enum CalibrationState {
    Idle,
    Calibrating,
    Done
}

export class CalibrationContext {
    private data: CalibrationData = new CalibrationData()
    private internalState: CalibrationState = CalibrationState.Idle
    public get state(): CalibrationState { return this.internalState }

    public reset() {
        this.data = new CalibrationData()
        this.internalState = CalibrationState.Idle
    }

    public async calibrate(duration: number) {
        this.internalState = CalibrationState.Calibrating
        await wait(duration)
        this.internalState = CalibrationState.Done
        return this.data
    }

    public updateAngles(angles: Float32Array) {
        for (let i = 0; i < 20; i++) {
            this.data.limits.min[i] = Math.min(this.data.limits.min[i], angles[i])
            this.data.limits.max[i] = Math.max(this.data.limits.max[i], angles[i])
        }
    }
}