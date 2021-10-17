<script lang="ts">
import { ChartData, ChartOptions } from 'chart.js'
import { Component, Prop, mixins as Mixins } from 'nuxt-property-decorator'
import { Line, Scatter, mixins } from 'vue-chartjs'

@Component({ extends: Line, mixins: [mixins.reactiveProp] })
export default class extends Mixins(mixins.reactiveProp, Line) {
    @Prop({ default: null }) chartData!: ChartData
    @Prop({ default: null }) options!: ChartOptions

    update() {
        this.renderChart(this.chartData, this.options)
    }

    mounted() {
        this.update()
    }
}
</script>
