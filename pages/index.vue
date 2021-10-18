<template lang="pug">
div(ref="container")
    FpsWidget(:value="fps")
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import { Core } from '@/modules/augmented_reality'
import { HandTracker, MediaPipeTracker } from '@/modules/hand_tracking/tracker'
import {
    LandmarkSmootherPlugin,
    MP3DAngleEstimatorPlugin
} from '@/modules/hand_tracking/tracker/plugins'

import { FPSData, FPSPlugin } from '~/modules/hand_tracking/tracker/plugins/FPSPlugin'

@Component
export default class extends Vue {
    @Ref('container') container!: HTMLDivElement
    fps: FPSData | null = null
    core!: Core
    tracker!: HandTracker

    mounted() {
        this.core = new Core({
            container: this.container,
            arSourceParams: {
                sourceWidth: 640,
                sourceHeight: 480
            },
            arContextParams: {
                patternRatio: 0.9
            },
            fullscreen: true
        })

        this.tracker = new MediaPipeTracker(
            {
                target: this.core.arSourceVideo,
                plugins: [
                    new LandmarkSmootherPlugin(),
                    new MP3DAngleEstimatorPlugin(),
                    new FPSPlugin()
                ],
                maxNumHands: 2,
                minTrackingConfidence: 0.9,
                selfieMode: false
            },
            {
                locateFile: (file) => `/mediapipe/${file}`
            }
        )

        this.tracker.onResults((result) => {
            if (result.fps) {
                console.log(result.fps)
                this.fps = result.fps
            }
        })

        this.tracker.start()
        this.core.start()
    }
}
</script>
