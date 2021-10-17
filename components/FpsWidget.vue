<template lang="pug">
b-card.fps-widget
    .grid
        span FPS
        span {{ fps.toFixed(1) }}
        span Max
        span {{ max.toFixed(1) }}
        span Min
        span {{ min.toFixed(1) }}
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'nuxt-property-decorator'

@Component
export default class extends Vue {
    @PropSync('frames') syncedFrames!: number
    @Prop({ default: 1000 }) interval!: number

    intervalId?: number
    fps: number = 0
    max: number = -Infinity
    min: number = Infinity

    reset() {
        this.max = -Infinity
        this.min = Infinity
    }

    @Watch('interval', { immediate: true })
    onIntervalChange() {
        window.clearInterval(this.intervalId)
        this.syncedFrames = 0
        this.max = -Infinity
        this.min = Infinity

        this.intervalId = window.setInterval(() => {
            this.fps = this.syncedFrames / (this.interval / 1000)
            this.max = Math.max(this.max, this.fps)
            this.min = Math.min(this.min, this.fps)
            this.syncedFrames = 0
        }, this.interval)
    }
}
</script>

<style scoped>
.fps-widget {
    position: absolute;
    top: 4px;
    right: 4px;
    opacity: 0.65;
}

.card-body {
    padding: 8px;
}

.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100px;
}
</style>
