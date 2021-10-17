<template lang="pug">
div(ref="container")
    FpsWidget(ref="fps" :frames.sync="frames")
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import { Core } from '@/modules/augmented_reality'
import { HandTracker, MediaPipeTracker } from '@/modules/hand_tracking/tracker'
import { LandmarkSmootherPlugin, MP3DAngleEstimatorPlugin } from '@/modules/hand_tracking/tracker/plugins'

import FpsWidget from '@/components/FpsWidget.vue'

@Component
export default class extends Vue {
    @Ref('container') container!: HTMLDivElement
    @Ref('fps') fps!: FpsWidget

    core!: Core
    tracker!: HandTracker

    frames: number = 0

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
                plugins: [new LandmarkSmootherPlugin(), new MP3DAngleEstimatorPlugin()],
                maxNumHands: 2,
                minTrackingConfidence: 0.9,
                selfieMode: false
            },
            {
                locateFile: (file) => `/mediapipe/${file}`
            }
        )

        this.tracker.onResults(({ results }) => {
            if (results.length) {
                console.log(results)
            }
        })

        this.tracker.start()
        this.core.start()
    }
}
</script>
