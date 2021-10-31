<template>
    <b-modal id="modal-control-panel" @ok="confirm">
        <b-card class="control-panel">
            <b-row>
                <b-col>
                    <label for="sb-max-num-hands">手部追蹤數量</label>
                </b-col>
            </b-row>

            <b-row>
                <b-col>
                    <b-form-spinbutton
                        id="sb-max-num-hands"
                        min="1"
                        max="2"
                        v-model.number="internalValue.maxNumHands"
                    ></b-form-spinbutton>
                </b-col>
            </b-row>
            <hr />

            <b-row>
                <b-col>
                    <b-form-checkbox switch v-model="internalValue.selfieMode">
                        自拍模式(拍攝手心)
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <hr />

            <b-row>
                <b-col>
                    <b-form-checkbox switch v-model="internalValue.drawLandmarks">
                        是否繪製Landmarks
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <hr />

            <b-row>
                <b-col>
                    <label>鍵盤位置</label>
                </b-col>
            </b-row>

            <b-row>
                <b-col>
                    <b-form-input
                        min="-50"
                        max="50"
                        step="0.1"
                        type="number"
                        v-model.number="internalValue.position.x"
                    ></b-form-input>
                </b-col>
                <b-col>
                    <b-form-input
                        min="-50"
                        max="50"
                        step="0.1"
                        type="number"
                        v-model.number="internalValue.position.y"
                    ></b-form-input>
                </b-col>
                <b-col>
                    <b-form-input
                        min="-50"
                        max="50"
                        step="0.1"
                        type="number"
                        v-model.number="internalValue.position.z"
                    ></b-form-input>
                </b-col>
            </b-row>

            <hr />

            <b-row>
                <b-col>
                    <label>鍵盤旋轉</label>
                </b-col>
            </b-row>

            <b-row>
                <b-col>
                    <b-form-input
                        type="number"
                        min="-6.3"
                        max="6.3"
                        step="0.1"
                        v-model.number="internalValue.rotation.x"
                    ></b-form-input>
                </b-col>
                <b-col>
                    <b-form-input
                        type="number"
                        min="-6.3"
                        max="6.3"
                        step="0.1"
                        v-model.number="internalValue.rotation.y"
                    ></b-form-input>
                </b-col>
                <b-col>
                    <b-form-input
                        type="number"
                        min="-6.3"
                        max="6.3"
                        step="0.1"
                        v-model.number="internalValue.rotation.z"
                    ></b-form-input>
                </b-col>
            </b-row>
        </b-card>
    </b-modal>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

export type Options = {
    maxNumHands: 1 | 2
    drawLandmarks: boolean
    selfieMode: boolean
    position: {
        x: number
        y: number
        z: number
    }
    rotation: {
        x: number
        y: number
        z: number
    }
}

@Component
export default class extends Vue {
    @Prop({ default: () => {} }) value!: Options

    show: boolean = true

    internalValue: Options = {
        maxNumHands: 2,
        drawLandmarks: true,
        selfieMode: false,
        position: {
            x: 0,
            y: 0,
            z: -2.75
        },
        rotation: {
            x: 0.8,
            y: 0,
            z: 0
        }
    }

    confirm() {
        localStorage.setItem('settings', JSON.stringify(this.internalValue))
        this.$emit('input', Object.assign({}, this.internalValue))
    }

    created() {
        let saved = localStorage.getItem('settings')
        if (saved) {
            this.internalValue = JSON.parse(saved)
        }
    }

    mounted() {
        this.$emit('input', Object.assign({}, this.internalValue))
    }
}
</script>

<style scoped>
</style>
