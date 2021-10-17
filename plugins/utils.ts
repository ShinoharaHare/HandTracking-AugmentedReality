import Vue from 'vue'


Vue.prototype.download = function (url: string, name: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
}