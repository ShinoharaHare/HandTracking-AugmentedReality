<template lang="pug">
b-card.fps-widget
    .grid
        span FPS
        span {{ fps }}
        span Avg.
        span {{ avgFps }}
        span Max.
        span {{ maxFps }}
        span Min.
        span {{ minFps }}
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { FPSData } from '@/modules/hand_tracking/tracker/plugins/FPSPlugin'

@Component
export default class extends Vue {
    @Prop() value!: FPSData | null

    get fps() {
        return this.value?.current?.toFixed(1)
    }

    get avgFps() {
        return this.value?.average?.toFixed(1)
    }

    get maxFps() {
        return this.value?.max?.toFixed(1)
    }

    get minFps() {
        return this.value?.min?.toFixed(1)
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
