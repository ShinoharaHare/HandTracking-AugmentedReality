import fs from 'fs'
import path from 'path'

export default {
    // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
    ssr: false,

    // Target: https://go.nuxtjs.dev/config-target
    target: 'static',

    // Global page headers: https://go.nuxtjs.dev/config-head
    head: {
        title: 'HandTracking+AugmentedReality',
        htmlAttrs: {
            lang: 'zh-TW'
        },
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1'
            },
            { hid: 'description', name: 'description', content: '' },
            { name: 'format-detection', content: 'telephone=no' }
        ],
        link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        script: [
            { src: '/vendors/Base64Binary.js' },
            { src: '/vendors/MIDI.min.js' }
        ]
    },

    // Global CSS: https://go.nuxtjs.dev/config-css
    css: ['@/assets/main.css', '@/modules/simple_game_engine/main.css'],

    // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
    plugins: ['@/plugins/utils.ts'],

    // Auto import components: https://go.nuxtjs.dev/config-components
    components: true,

    // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
    buildModules: [
        // https://go.nuxtjs.dev/typescript
        '@nuxt/typescript-build'
    ],

    // Modules: https://go.nuxtjs.dev/config-modules
    modules: [
        // https://go.nuxtjs.dev/bootstrap
        'bootstrap-vue/nuxt',
        // https://go.nuxtjs.dev/axios
        '@nuxtjs/axios'
    ],

    // Axios module configuration: https://go.nuxtjs.dev/config-axios
    axios: {},

    // Build Configuration: https://go.nuxtjs.dev/config-build
    build: {},

    alias: {
        'ar-threex': '@ar-js-org/ar.js/three.js/build/ar-threex.js'
    },

    server: {
        https: {
            key: fs.readFileSync(path.resolve(__dirname, './cert/server.key')),
            cert: fs.readFileSync(path.resolve(__dirname, './cert/server.crt'))
        },
        port: 3000, // default: 3000
        host: '0.0.0.0' // default: localhost
    },

    loading: '@/components/Loading.vue'
}
