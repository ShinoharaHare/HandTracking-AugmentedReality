import Vue from 'vue'

declare module 'vue/types/vue' {
    interface Vue {
        download: (url: string, filename: string) => void
    }
}
