<template lang="pug">
b-card(no-body)    
    b-tabs(card)
        b-tab(title="Video to Landmarks")
            video(ref="v2lVideo" width="640" height="480" :src="v2l.src" :currentTime.prop="v2l.currentTime")
            .p-4
                b-row
                    b-col
                        b-form-file(accept="video/*" placeholder="選擇影片" browse-text="瀏覽" v-model="v2l.videoFile")
                    b-col
                        b-form-input(placeholder="輸入影片幀率" type="number" min="0" v-model="v2l.frameRate")
            
            .actions-wrap
                b-button(variant="info" :disabled="v2l.converting" @click="downloadLandmarks") {{ v2l.buttonText }}
        
        b-tab(title="Landmarks to Angles")
            .p-4
                b-row
                    b-col
                        b-form-file(accept=".landmarks.jsonl" placeholder="選擇Landmarks" browse-text="瀏覽" v-model="l2a.inputFile")
                
                b-row.mt-2
                    b-col.text-center
                        b-form-checkbox(switch id="switch-smooth" slot="header" v-model="l2a.smooth")
                            label(for="switch-smooth") 啟用平滑化
                b-collapse(v-model="l2a.smooth")
                    b-row.text-center
                        b-col
                            label Count
                        b-col
                            label Tolerance(°)
                    b-row.text-center
                        b-col
                            b-form-spinbutton(vertical step="1" v-model="l2a.count")
                        b-col
                            b-form-spinbutton(vertical step="1" v-model="l2a.tolerance")
            
            .actions-wrap
                b-button(variant="info" @click="downloadAngles") 轉換&#38;下載
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import { Hands, NormalizedLandmark } from '@mediapipe/hands'
import { AngleData, AngleSmoother, MP3DEstimator } from '@/modules/hand_tracking'

const hands = new Hands({ locateFile: (file) => `/mediapipe/${file}` })
hands.setOptions({
    maxNumHands: 1,
    minTrackingConfidence: 0.9
})

@Component({ layout: 'center' })
export default class extends Vue {
    @Ref('v2lVideo') v2lVideo!: HTMLVideoElement

    v2l = {
        videoFile: null as File | null,
        frameRate: 29.32,
        src: '',
        totalFrame: 0,
        currentFrame: 0,
        currentTime: 0,
        buttonText: '轉換&下載',
        converting: false
    }

    l2a = {
        inputFile: null as File | null,
        smooth: false,
        count: 5,
        tolerance: 2
    }

    async downloadLandmarks() {
        if (!this.v2l.videoFile) {
            return
        }

        let json = ''
        this.v2l.currentTime = 0
        this.v2l.converting = true

        for (this.v2l.currentFrame = 0; this.v2l.currentFrame < this.v2l.totalFrame; this.v2l.currentFrame++) {
            this.v2l.currentTime = this.v2l.currentFrame / this.v2l.frameRate
            await new Promise<void>((resolve) => {
                hands.send({ image: this.v2lVideo })
                hands.onResults((results) => {
                    json += JSON.stringify(results.multiHandLandmarks[0]) + '\n'
                    resolve()
                })
            })
            await new Promise(resolve => setTimeout(resolve, 1 / 60))
            this.v2l.buttonText = this.v2l.currentFrame + '/' + this.v2l.totalFrame
            this.$forceUpdate()
        }
        this.v2l.buttonText = '轉換&下載'
        this.v2l.converting = false

        const url = URL.createObjectURL(new Blob([json]))
        this.download(url, this.v2l.videoFile.name.split('.')[0] + '.landmarks.jsonl')
        URL.revokeObjectURL(url)
    }

    async downloadAngles() {
        if (!this.l2a.inputFile) {
            return
        }
        const text = await this.l2a.inputFile.text()
        const lines = text.split('\n')

        const estimator = new MP3DEstimator()
        const smoother = new AngleSmoother(this.l2a.count, this.l2a.tolerance * (Math.PI / 180))
        const smoothAngle = new AngleData()
        const angleData = new AngleData()

        smoother.bind(smoothAngle)
        let json = ''
        for (let line of lines) {
            if (!line) {
                break
            }
            const landmarks: NormalizedLandmark[] = JSON.parse(line)

            estimator.update(landmarks)
            estimator.getAngles(angleData)
            if (this.l2a.smooth) {
                smoother.update(angleData)
                json += smoothAngle.toJSON() + '\n'
            } else {
                json += angleData.toJSON() + '\n'
            }
        }
        const url = URL.createObjectURL(new Blob([json]))
        this.download(url, this.l2a.inputFile.name.split('.')[0] + '.angles.jsonl')
    }

    @Watch('v2l.videoFile')
    onV2lVideoFileChange(v: File | null) {
        if (!v) {
            return
        }
        URL.revokeObjectURL(this.v2l.src)
        this.v2l.src = URL.createObjectURL(v)
    }

    mounted() {
        this.v2lVideo.addEventListener('loadedmetadata', () => {
            this.v2l.totalFrame = Math.floor(this.v2lVideo.duration * this.v2l.frameRate)
        })
    }
}
</script>

<style scoped>
::v-deep .actions-wrap {
    display: flex;
    justify-content: center;
}
</style>
