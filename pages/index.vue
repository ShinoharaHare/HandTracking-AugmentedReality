<template>
    <div ref="container">
        <div class="container-overlay">
            <FpsWidget :value="fps"></FpsWidget>
            <b-button class="btn-setting" v-b-modal.modal-control-panel>設定</b-button>
        </div>
        <ControlPanel v-model="options"></ControlPanel>

        <transition name="fade">
            <div class="hint" v-show="showHint">
                <div class="d-flex align-items-center">
                    <b-spinner variant="white"></b-spinner>

                    <div class="d-flex flex-column ml-4 text-center fs-xx-large">
                        <div>
                            <span>正在校正</span>
                            <span class="handedness-text">{{ hintText }}</span>
                        </div>
                        <div>請隨意開合、彎曲手指</div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import * as THREE from 'three'

import { Core } from '@/modules/simple_game_engine'
import {
    Handedness,
    HandTracker,
    HandTrackerResult,
    MediaPipeTracker
} from '@/modules/hand_tracking/tracker'
import {
    HandednessPlugin,
    SmoothLandmarksPlugin,
    FPSData,
    FPSPlugin,
    MediaPipe3DAnglePlugin
} from '@/modules/hand_tracking/tracker/plugins'
import { KeyboardHandScene } from '@/modules/object/KeyboardHandScene'

import { Data, drawConnectors, drawLandmarks, lerp } from '@mediapipe/drawing_utils'
import { HAND_CONNECTIONS } from '@mediapipe/hands'

import { Options } from '@/components/ControlPanel.vue'
import { CalibrationContext, CalibrationData, CalibrationState } from '@/modules/calibration'

@Component
export default class extends Vue {
    @Ref('container') container!: HTMLDivElement
    fps: FPSData = {
        current: 0,
        average: 0,
        min: 0,
        max: 0
    }
    core!: Core
    handednessPlugin: HandednessPlugin = new HandednessPlugin()
    tracker!: MediaPipeTracker
    options: Options | null = null
    keyboardHandScene: KeyboardHandScene = new KeyboardHandScene()

    showHint: boolean = false
    hintText: string = ''

    draw(result: HandTrackerResult) {
        const canvasCtx = this.core.context2D
        // canvasCtx.clearRect(0, 0, this.core.canvas2D.width, this.core.canvas2D.height)

        result.multiHandedness?.forEach((handedness, i) => {
            const landmarks = result.multiSmoothLandmarks![i]
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
    }

    @Watch('options')
    async onOptionsChange(val: Options) {
        this.keyboardHandScene.keyboard.position.set(val.position.x, val.position.y, val.position.z)
        this.keyboardHandScene.keyboard.rotation.set(val.rotation.x, val.rotation.y, val.rotation.z)

        await this.tracker.stop()
        this.tracker.maxNumHands = val.maxNumHands
        this.tracker.hands.setOptions({ maxNumHands: val.maxNumHands })
        this.tracker.start()

        this.handednessPlugin.selfieMode = val.selfieMode
        this.keyboardHandScene.behavior.selfieMode = val.selfieMode

        if (val.selfieMode) {
            this.core.flip()
        } else {
            this.core.unflip()
        }
    }

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

        // const cube = new THREE.Mesh(
        //     new THREE.BoxBufferGeometry(1, 1, 1),
        //     new THREE.MeshPhongMaterial({ color: 0xffffff })
        // )
        const dummy = new THREE.Object3D()
        this.core.addMarker(
            {
                patternUrl: '/pattern/aruco-8-0.9.patt',
                type: 'pattern'
            },
            dummy
        )
        this.core.add(this.keyboardHandScene)
        this.core.addEventListener('update', () => {
            if (this.options?.trackMarker) {
                this.keyboardHandScene.position.copy(dummy.position)
                this.keyboardHandScene.rotation.copy(dummy.rotation)
                this.keyboardHandScene.scale.copy(dummy.scale)
            }
        })

        // const left = new Hand(Handedness.Left)
        // left.rotation.x = Math.PI / 2
        // left.rotation.z = Math.PI
        // left.position.x = 0.5
        // left.position.z = -3.0
        // left.position.y = -0.5
        // this.core.add(left)

        // const right = new Hand(Handedness.Right)
        // right.rotation.x = Math.PI / 2
        // right.rotation.z = Math.PI
        // right.position.x = -0.5
        // right.position.z = -3.0
        // right.position.y = -0.5
        // this.core.add(right)

        this.tracker = new MediaPipeTracker(
            this.core.arSourceVideo,
            {
                plugins: [
                    this.handednessPlugin,
                    new SmoothLandmarksPlugin({ smoothCount: 2, smoothTolerance: 0.001 }),
                    new MediaPipe3DAnglePlugin({
                        multiHandlandmarksPropertyName: 'multiSmoothLandmarks'
                    }),
                    new FPSPlugin()
                ],
                maxNumHands: 2,
                minDetectionConfidence: 0.9,
                minTrackingConfidence: 0.9,
                minInterval: 0,
                modelComplexity: 1
            },
            {
                locateFile: (file) => `/mediapipe/${file}`
            }
        )

        let leftContext = new CalibrationContext()
        let rightContext = new CalibrationContext()

        this.tracker.onResults((result) => {
            // console.log(result)

            this.fps = result.fps ?? this.fps
            this.keyboardHandScene.behavior.result = result
            this.core.context2D.clearRect(0, 0, this.core.canvas2D.width, this.core.canvas2D.height)

            if (this.options?.drawLandmarks) {
                this.draw(result)
            }

            result.multiHandedness?.map((handedness, i) => {
                const context = handedness === Handedness.Left ? leftContext : rightContext
                if (context.state === CalibrationState.Idle) {
                    this.showHint = true
                    this.hintText = handedness === Handedness.Left ? '左手' : '右手'
                    context
                        .calibrate(5000)
                        .then(data => {
                            this.showHint = false
                            let thresholds = data.getThresholds(0.4)
                            this.keyboardHandScene.behavior.thresholds.set(handedness, thresholds)
                        })
                } else if (context.state === CalibrationState.Calibrating) {
                    context.updateAngles(result.multiHandAngles![i])
                }
            })
        })

        this.tracker.start()
        this.core.start()
    }

    beforeDestroy() {
        this.tracker.stop(true)
        this.core.stop()
    }
}
</script>

<style scoped>
.container-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.fps-widget {
    position: relative;
    width: max-content;
    margin: 4px 4px auto auto;
    opacity: 0.8;
}

.btn-setting {
    display: block;
    position: relative;
    margin: 4px 4px auto auto;
    z-index: 5;
}

.handedness-text {
    color: rgb(245, 235, 101);
}

.hint {
    left: 50%;
    transform: translate(-50%, 0px);
    position: absolute;
    color: rgb(255, 255, 255);
    background: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    white-space: pre-wrap;
    padding: 4px 16px;
}
</style>
