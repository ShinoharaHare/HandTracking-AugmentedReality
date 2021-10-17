<template lang="pug">
    b-card.text-center(no-body title="轉換工具")
        b-card-title(slot="header") 轉換工具
        
        b-card(title="影片轉Landmarks")
            b-form-file(placeholder="選擇影片" v-model="file")

        .d-flex.justify-content-center.mt-2
            b-button(variant="primary" :disabled="false" @click="exportData") 匯出
            b-button(download="data.jsonl" variant="success" :disabled="false" :href="href") 下載

</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import { Hands } from '@mediapipe/hands'

@Component({ layout: 'center' })
export default class extends Vue {
    @Ref('video') video!: HTMLVideoElement
    src: string = ''
    file: File | null = null
    hands: Hands = new Hands({ locateFile: (file) => `/mediapipe/${file}` })
    href: string = ''

    @Watch('file')
    onFileChange(file: File) {
        if (!file) {
            return
        }
        URL.revokeObjectURL(this.src)
        this.src = URL.createObjectURL(file)
    }

    exportData() {
        if (!this.file) {
            return
        }

        let json = ''
        const callback = (now: DOMTimeStamp, metadata: VideoFrameMetadata) => {
            this.video.pause()
            this.video.requestVideoFrameCallback(callback)

            this.hands.onResults((results) => {
                json += JSON.stringify(results.multiHandLandmarks[0]) + '\n'
                this.video.play()
            })
            this.hands.send({ image: this.video })
        }
        this.video.requestVideoFrameCallback(callback)
        this.video.play()

        this.video.onended = () => {
            const blob = new Blob([json], {
                type: 'application/json'
            })
            this.href = URL.createObjectURL(blob)
        }
    }

    mounted() {
        this.hands.setOptions({
            maxNumHands: 1,
            minTrackingConfidence: 0.9
        })
    }
}
</script>
