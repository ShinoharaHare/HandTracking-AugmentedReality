<template lang="pug">
    b-overlay(no-wrap :show="loading")
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class extends Vue {
    loading: boolean = false

    start() {
        this.loading = true
    }

    finish() {
        this.loading = false
    }
}
</script>

<style scoped></style>
