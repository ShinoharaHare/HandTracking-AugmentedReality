<template lang="pug">
    .main
        Nuxt
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class extends Vue {

}
</script>

<style scoped>
.main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}
</style>