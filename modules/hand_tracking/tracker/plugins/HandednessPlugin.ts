import { HandTrackerPlugin, HandTrackerResult, Landmarks, Handedness } from '../HandTracker'

export interface HandednessPluginOptions {
    selfieMode: boolean
}

export class HandednessPlugin extends HandTrackerPlugin {
    selfieMode: boolean = false

    constructor(options?: Partial<HandednessPluginOptions>) {
        super('HandednessPlugin')

        this.selfieMode = options?.selfieMode ?? this.selfieMode
    }

    onStart(): void {}
    onResult(result: HandTrackerResult): void {
        if (result.multiHandLandmarks) {
            result.multiHandedness = this.getHandednessByLandmarks(result.multiHandLandmarks)
        }
    }

    private reverseHandedness(label: Handedness): Handedness {
        return label === Handedness.Left ? Handedness.Right : Handedness.Left
    }

    private getHandednessByLandmarks(multiHandLandmarks: Landmarks[]): Handedness[] {
        const multiHandedness: Handedness[] = []

        multiHandLandmarks.forEach((landmarks, i) => {
            let handedness: Handedness = Handedness.Left
            multiHandedness.push(handedness)
            if (landmarks[5].x < landmarks[17].x) {
                handedness = Handedness.Right
            }
            if (this.selfieMode) {
                handedness = this.reverseHandedness(handedness)
            }
        })

        return multiHandedness
    }

    private getHandednessByHandPosition(multiHandLandmarks: Landmarks[]): Handedness[] {
        const multiHandedness: Handedness[] = []
        if (multiHandLandmarks[0][0] < multiHandLandmarks[1][0]) {
            multiHandedness.push(Handedness.Left)
            multiHandedness.push(Handedness.Right)
        } else {
            multiHandedness.push(Handedness.Right)
            multiHandedness.push(Handedness.Left)
        }
        return multiHandedness
    }
}
