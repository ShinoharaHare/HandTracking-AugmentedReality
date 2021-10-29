<template >
    <b-card no-body class="fps-widget">
        <b-table-simple striped small caption-top responsive class="fps-table text-center">
            <b-thead head-variant="dark">
                <b-tr>
                    <b-th>Cur.</b-th>
                    <b-th>Avr.</b-th>
                    <b-th>Max.</b-th>
                    <b-th>Min.</b-th>
                </b-tr>
            </b-thead>
            <b-tbody>
                <b-tr>
                    <b-td>{{ current }}</b-td>
                    <b-td>{{ average }}</b-td>
                    <b-td>{{ max }}</b-td>
                    <b-td>{{ min }}</b-td>
                </b-tr>
            </b-tbody>
        </b-table-simple>
    </b-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { FPSData } from '@/modules/hand_tracking/tracker/plugins/FPSPlugin'

@Component
export default class extends Vue {
    @Prop() value!: FPSData | null

    get current() {
        return this.value?.current?.toFixed(1)
    }

    get average() {
        return this.value?.average?.toFixed(1)
    }

    get max() {
        return this.value?.max?.toFixed(1)
    }

    get min() {
        return this.value?.min?.toFixed(1)
    }
}
</script>

<style scoped>
.fps-table {
    border-radius: 4px;
    margin: 0;
}
</style>
