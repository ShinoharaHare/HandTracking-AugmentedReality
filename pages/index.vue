<template lang="pug">
div(ref='container')
    FpsWidget(:value='fps')
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import * as THREE from 'three'

import { Core } from '@/modules/simple_game_engine'
import { Handedness, HandTracker, MediaPipeTracker } from '@/modules/hand_tracking/tracker'
import {
    HandednessPlugin,
    SmoothLandmarkPlugin,
    FPSData,
    FPSPlugin,
    MediaPipe3DAnglePlugin
} from '@/modules/hand_tracking/tracker/plugins'

import { Data, drawConnectors, drawLandmarks, lerp } from '@mediapipe/drawing_utils'
import { HAND_CONNECTIONS, NormalizedLandmark } from '@mediapipe/hands'
import { Hand } from '@/modules/object/Hand'

@Component
export default class extends Vue {
    @Ref('container') container!: HTMLDivElement
    fps: FPSData | null = null
    core!: Core
    tracker!: HandTracker

    mounted() {
        window.core = this.core = new Core({
            container: this.container,
            arSourceParams: {
                // sourceType: 'video',
                // sourceUrl: '/test.mkv',
                sourceWidth: 640,
                sourceHeight: 480
            },
            arContextParams: {
                patternRatio: 0.9
            },
            fullscreen: false
        })
        this.core.add(new THREE.AmbientLight(0x666666))
        this.core.add(new THREE.DirectionalLight(0xffffff, 0.5))

        const left = new Hand(Handedness.Left)
        left.rotation.x = Math.PI / 2
        left.rotation.z = Math.PI
        left.position.x = 0.5
        left.position.z = -3.0
        left.position.y = -0.5
        this.core.add(left)

        const right = new Hand(Handedness.Right)
        right.rotation.x = Math.PI / 2
        right.rotation.z = Math.PI
        right.position.x = -0.5
        right.position.z = -3.0
        right.position.y = -0.5
        this.core.add(right)

        this.tracker = new MediaPipeTracker(
            this.core.arSourceVideo,
            {
                plugins: [
                    new HandednessPlugin({ selfieMode: true }),
                    new SmoothLandmarkPlugin({ smoothCount: 2, smoothTolerance: 0.001 }),
                    new MediaPipe3DAnglePlugin({
                        multiHandlandmarksPropertyName: 'multiSmoothLandmarks'
                    }),
                    new FPSPlugin()
                ],
                maxNumHands: 2,
                minDetectionConfidence: 0.9,
                minTrackingConfidence: 0.9,
                minInterval: 0
            },
            {
                locateFile: (file) => `/mediapipe/${file}`
            }
        )

        this.tracker.onResults((result) => {
            if (result.fps) {
                this.fps = result.fps
            }

            const canvasCtx = this.core.context2D
            canvasCtx.clearRect(0, 0, this.core.canvas2D.width, this.core.canvas2D.height)

            result.multiHandedness?.forEach((handedness, i) => {
                const landmarks = result.multiSmoothLandmarks![i]
                // const landmarks = result.multiHandLandmarks![i]

                if (handedness === Handedness.Left) {
                    left.behavior.angles.set(result.multiHandAngles![i])
                } else {
                    right.behavior.angles.set(result.multiHandAngles![i])
                }

                canvasCtx.save()
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                    color: handedness === Handedness.Left ? '#00FF00' : '#FF0000'
                })
                drawLandmarks(canvasCtx, landmarks, {
                    color: handedness === Handedness.Left ? '#00FF00' : '#FF0000',
                    fillColor: handedness === Handedness.Left ? '#FF0000' : '#00FF00',
                    radius: (data: Data) => lerp(data.from!.z!, -0.15, 0.1, 10, 1)
                })
                canvasCtx.restore()
            })
        })

        this.tracker.start()
        this.core.start()
    }
}
</script>
