<template lang="pug">
    .d-flex.flex-column.p-4
        b-card
            b-card-title.text-center 平滑化

            b-form-file(accept=".landmarks.jsonl" browse-text="瀏覽" placeholder="" v-model="inputFile")

            b-card.mt-2
                b-form-checkbox(switch id="switch-smooth" slot="header" v-model="smooth.enabled")
                    label(for="switch-smooth") 啟用平滑化
                    
                b-row.text-center
                    b-col
                        label Count
                    b-col
                        label Tolerance(°)
                b-row.text-center
                    b-col
                        b-form-spinbutton(vertical step="1" v-model="smooth.count")
                    b-col
                        b-form-spinbutton(vertical step="1" v-model="smooth.tolerance")

            b-card.mt-2
                LineChart(ref="chart" :chartData="data" :options="options")
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import { NormalizedLandmark } from '@mediapipe/hands'
import { ChartData, ChartOptions } from 'chart.js'

import { AngleSmoother, MP3DEstimator } from '@/modules/hand_tracking'
import { AngleData } from '@/modules/hand_tracking/AngleData'

import LineChart from '~/components/LineChart.vue'

@Component({
    layout: 'center'
})
export default class extends Vue {
    @Ref('chart') chart!: LineChart

    estimator: MP3DEstimator = new MP3DEstimator()
    smoother!: AngleSmoother
    smoothed: AngleData = new AngleData()
    smoothEnabled: boolean = false

    smooth = {
        enabled: false,
        count: 5,
        tolerance: 2
    }

    inputFile: File | null = null

    data: ChartData = {
        labels: [],
        datasets: [
            {
                label: 'Proximal',
                fill: false,
                borderColor: 'rgba(255, 99, 132, 0.9)',
                pointRadius: 0,
                borderWidth: 1,
                data: []
            },
            {
                label: 'Intermediate',
                fill: false,
                borderColor: 'rgba(54, 162, 235, 0.9)',
                pointRadius: 0,
                borderWidth: 1,
                data: []
            },
            {
                label: 'Distal',
                fill: false,
                borderColor: 'rgba(255, 206, 86, 0.9)',
                pointRadius: 0,
                borderWidth: 1,
                data: []
            }
        ]
    }
    
    options: ChartOptions = {
        devicePixelRatio: 2,
        legend: {
            position: 'top',
            align: 'center'
        },
        scales: {
            xAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: 'Time (Frame)'
                    }
                }
            ],
            yAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: 'Angle (rad)'
                    }
                }
            ]
        }
    }

    async updateChart() {
        if (!this.inputFile) {
            return
        }

        let text = await this.inputFile!.text()
        this.data.labels = []
        for (let i of [0, 1, 2]) {
            this.data.datasets![i].data = []
        }

        for (let line of text.split('\n')) {
            if (!line) {
                break
            }
            const landmarks: NormalizedLandmark[] = JSON.parse(line)
            this.estimator.update(landmarks)
            const unsmoothed = this.estimator.getAngles()
            this.smoother.update(unsmoothed)
            for (let i of [0, 1, 2]) {
                let angleData = this.smooth.enabled ? this.smoothed : unsmoothed
                this.data.datasets![i].data!.push(angleData.getByIndex(i + 3))
            }
            this.data.labels!.push(this.data.labels!.length + 1)
        }
        this.chart.update()
    }

    @Watch('smooth', { immediate: true, deep: true })
    onSmoothCountChange() {
        this.smoother = new AngleSmoother(
            this.smooth.count,
            this.smooth.tolerance * (Math.PI / 180)
        )
        this.smoother.bind(this.smoothed)
        this.updateChart()
    }

    @Watch('inputFile')
    onInputFileChange() {
        this.updateChart()
    }
}
</script>

<style scoped>
.wrap * {
    margin: 4px;
}
</style>
