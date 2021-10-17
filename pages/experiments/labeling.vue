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
        .text-center 全部
        .text-center(v-for="i in 5")
            b-button(block :variant="getVariant('danger', i - 1)" @click="label(i - 1, false)") X
            b-button(block :variant="getVariant('primary', i - 1)" @click="label(i - 1, true)") O
        .text-center
            b-button(pill block variant="danger" @click="label(-1, false)") X
            b-button(pill block variant="primary" @click="label(-1, true)") O

    
    .btn-wrap
        b-form-checkbox(switch id="switch-keep--previous" v-model="keepPrevious")
            label(for="switch-keep--previous") 保留前一幀

        b-button(variant="danger" @click="prevFrame") 上一幀
        .inputs
            b-form-input(type="number" v-model.number="frameRate")
            b-form-input(type="number" min="0" :max="totalFrame" v-model.number="currentFrame")
        b-button(variant="success" @click="nextFrame") 下一幀
        b-button(variant="info" @click="latestFrame") 最新

    b-button(@click.prevent="downloadData") 下載資料
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
    keepPrevious: boolean = true

    db?: idb.IDBPDatabase<LabelDB>
    cached: Label[] = []

    get fingerNames() {
        return ['拇指', '食指', '中指', '無名指', '小指']
    }

    get currentLabel() {
        if (!this.cached[this.currentFrame]) {
            let v: any = undefined
            if (this.keepPrevious && this.cached[this.currentFrame - 1]) {
                v = Array.from(this.cached[this.currentFrame - 1])
            }
            this.cached[this.currentFrame] = v
        }
        return this.cached[this.currentFrame]
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
        if (finger === -1) {
            for (let i = 0; i < 5; i++) {
                this.currentLabel[i] = pressed
            }
        } else {
            this.currentLabel[finger] = pressed
        }
        this.onCachedChange()
        this.$forceUpdate()
    }

    getVariant(color: string, finger: number) {
        let prefix = 'outline-'
        switch (color) {
            case 'danger':
                this.currentLabel?.[finger] === false && (prefix = '')
                break
            case 'primary':
                this.currentLabel?.[finger] === true && (prefix = '')
                break
        }
        return prefix + color
    }

    downloadData() {
        let json = ''
        for (let value of Object.values(this.cached)) {
            json += JSON.stringify(value) + '\n'
        }
        const url = URL.createObjectURL(new Blob([json]))
        this.download(url, this.videoFile?.name.split('.')[0] + '.label.jsonl')
        URL.revokeObjectURL(url)
    }

    @Watch('videoFile')
    async onVideoFileChange() {
        if (this.videoFile) {
            URL.revokeObjectURL(this.videoSrc)
            this.videoSrc = URL.createObjectURL(this.videoFile)
            this.cached =
                (await this.db?.get('labels', this.videoFile!.name)) ?? []
        }
    }

    @Watch('currentFrame')
    onCurrentFrameChange(newValue: number) {
        this.currentTime = newValue / this.frameRate
    }

    @Watch('cached', { deep: true })
    onCachedChange() {
        this.db?.put('labels', this.cached, this.videoFile?.name)
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
    grid-template-columns: repeat(6, 1fr);
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
