<template lang="pug">
div(ref='container')
    .container-overlay
        FpsWidget(:value='fps')
        b-button.btn-setting(v-b-modal.modal-control-panel) 設定

    ControlPanel(v-model='options')
    p.alert-message(hidden="hidden") message
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
    onOptionsChange(val: Options) {
        this.keyboardHandScene.keyboard.position.set(val.position.x, val.position.y, val.position.z)
        this.keyboardHandScene.keyboard.rotation.set(val.rotation.x, val.rotation.y, val.rotation.z)

        this.tracker.stop()
        this.tracker.maxNumHands = val.maxNumHands
        this.tracker.hands.setOptions({ maxNumHands: val.maxNumHands })
        this.tracker.start()

        this.handednessPlugin.selfieMode = val.selfieMode
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

        const cube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xffffff })
        )
        // this.core.addMarker("pattern/pattern-4x4_1000-1.patt", this.keyboardHandScene);
        // this.core.add(cube);

        this.core.add(this.keyboardHandScene)

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

        this.tracker.onResults((result) => {
            this.fps = result.fps ?? this.fps
            this.keyboardHandScene.behavior.result = result
            this.core.context2D.clearRect(0, 0, this.core.canvas2D.width, this.core.canvas2D.height)

            if (this.options?.drawLandmarks) {
                this.draw(result)
            }
        })

        this.tracker.start()
        this.core.start()

        window.showAlert = (message: string, fadeOut = false) => {
            console.log(`%c ${message}`, " color: red; font-size: 2rem;");
            const am: any = document.querySelector('.alert-message');
            am.hidden = false;
            am.innerText = message;
            if(fadeOut) {
                am.classList.add("ani");
                setTimeout(() => {
                    am.classList.remove("ani");
                    am.hidden = true;
                }, 5000);
            }
        };
    }

    beforeDestroy() {
        this.tracker.stop()
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

.alert-message {
    left: 50%;
    transform: translate(-50%, 0px);
    position: absolute;
    font-size: 3rem;
    color: lightblue;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 5px;
}

.ani {
  animation: fadeout 5s 1;
}
@keyframes fadeout {
  from { opacity: 1; }
  to   { opacity: 0; }
}
</style>
