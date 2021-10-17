<template lang="pug">
b-card(no-body @keydown.left="prevFrame" @keydown.right="nextFrame" tabindex="0")
    b-card-title.text-center(slot="header") 標記

    .video-wrap
        video(ref="video" width="640" height="480" :src="videoSrc" :currentTime.prop="currentTime")
        .overlay
            b-form-file.video-selector(accept="video/*" v-model="videoFile")
    
    //- .btn-wrap
    //-     b-button(variant="success" @click="playVideo") 播放
    //-     b-button(variant="danger" @click="pauseVideo") 暫停

    .label-wrap
        .text-center(v-for="fingerName in fingerNames") {{ fingerName }}
        .text-center(v-for="i in 5")
            b-button(block :variant="getVariant('danger', i - 1)" @click="label(i - 1, false)") X
            b-button(block :variant="getVariant('primary', i - 1)" @click="label(i - 1, true)") O
    
    .btn-wrap
        b-button(variant="danger" @click="prevFrame") 上一幀
        .inputs
            b-form-input(type="number" v-model="frameRate")
            b-form-input(type="number" min="0" :max="totalFrame" v-model="currentFrame")
        b-button(variant="success" @click="nextFrame") 下一幀
        b-button(variant="info" @click="latestFrame") 最新

    b-button(:download="outputName" @click.prevent="download") 下載資料
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import * as idb from 'idb'

type Label = [boolean, boolean, boolean, boolean, boolean]

interface LabelDB extends idb.DBSchema {
    labels: {
        key: string
        value: Label[]
    }
}

@Component({ layout: 'center' })
export default class extends Vue {
    @Ref('video') video!: HTMLVideoElement
    videoFile: File | null = null
    videoSrc: string = ''
    currentFrame: number = 0
    currentTime: number = 0
    totalFrame: number = 0
    frameRate: number = 29.32

    db!: idb.IDBPDatabase<LabelDB>
    cached: Label[] = []

    get fingerNames() {
        return ['拇指', '食指', '中指', '無名指', '小指']
    }

    get currentLabel() {
        this.cached[this.currentFrame] = this.cached[this.currentFrame] ?? []
        return this.cached[this.currentFrame]
    }

    get outputName() {
        return this.videoFile?.name.split('.')[0] + '.label.jsonl'
    }

    playVideo() {
        this.video.play()
    }

    pauseVideo() {
        this.video.pause()
    }

    prevFrame() {
        this.currentFrame = Math.max(0, this.currentFrame - 1)
    }

    nextFrame() {
        this.currentFrame = Math.min(this.totalFrame, this.currentFrame + 1)
    }

    latestFrame() {
        this.currentFrame = this.cached.length - 1
    }

    async label(finger: number, pressed: boolean) {
        this.currentLabel[finger] = pressed
        this.db.put('labels', this.cached, this.videoFile?.name)
        this.$forceUpdate()
    }

    getVariant(color: string, finger: number) {
        let prefix = 'outline-'
        switch (color) {
            case 'danger':
                this.currentLabel[finger] === false && (prefix = '')
                break
            case 'primary':
                this.currentLabel[finger] === true && (prefix = '')
                break
        }
        return prefix + color
    }

    download(e: Event) {
        let json = ''
        for (let v of Object.values(this.cached)) {
            json += JSON.stringify(v) + '\n'
        }
        const a: HTMLAnchorElement = document.createElement('a')
        a.href =  URL.createObjectURL(new Blob([json]))
        a.download = this.outputName
        a.click()
        URL.revokeObjectURL(a.href)
    }

    @Watch('videoFile')
    async onVideoFileChange() {
        if (this.videoFile) {
            URL.revokeObjectURL(this.videoSrc)
            this.videoSrc = URL.createObjectURL(this.videoFile)
            this.cached =
                (await this.db.get('labels', this.videoFile!.name)) ?? []
        }
    }

    @Watch('currentFrame')
    onCurrentFrameChange() {
        this.currentTime = this.currentFrame / this.frameRate
    }

    async created() {
        this.db = await idb.openDB<LabelDB>('HandMotionTracking', 1, {
            upgrade(db) {
                db.createObjectStore('labels')
            }
        })
    }

    mounted() {
        this.video.addEventListener('loadedmetadata', () => {
            this.totalFrame = Math.floor(this.video.duration * this.frameRate)
        })

        window.test = this
    }
}
</script>

<style scoped>
:focus-visible {
    outline: none;
}

.video-wrap {
    position: relative;
}

.overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.overlay .video-selector {
    margin: 16px;
    opacity: 0;
}

.overlay:hover .video-selector {
    opacity: 0.8;
}

.label-wrap {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 4px;
    gap: 4px;
}

.btn-wrap {
    display: flex;
    justify-content: center;
}

.btn-wrap > * {
    margin: 4px;
}

.inputs {
    width: 80px;
}

.inputs > * {
    text-align: center;
    margin: 4px 0px;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>
