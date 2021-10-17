<template lang="pug">
    b-card.text-center(title="錄影工具")
        video(ref="video" width="640" height="480")
        
        .d-flex.justify-content-center
            b-button(variant="danger" :disabled="recording" @click="startRecording") 錄製
            b-button.mx-2(variant="primary" :disabled="!recording" @click="stopRecording") 停止
            b-button(download variant="success" :href="recordedUrl" :disabled="!recordedUrl") 下載
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'

@Component({ layout: 'center' })
export default class extends Vue {
    @Ref('video') video!: HTMLVideoElement
    recorder?: MediaRecorder
    stream?: MediaStream
    recordedUrl: string = ''
    recording: boolean = false

    startRecording() {
        this.recording = true
        this.recorder = new MediaRecorder(this.stream!)
        this.recorder.ondataavailable = (e) => {
            this.recordedUrl = URL.createObjectURL(e.data)
        }
        this.recorder.start()
    }

    stopRecording() {
        this.recorder?.stop()
        this.recording = false
    }

    async requestWebcam() {
        this.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: 640,
                height: 480
            }
        })
        this.video.srcObject = this.stream
        this.video.play()
    }

    mounted() {
        this.requestWebcam()
    }
}
</script>
