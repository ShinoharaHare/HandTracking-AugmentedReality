import * as THREE from 'three'
import * as THREEx from 'ar-threex'
import { GameObject } from './GameObject'
import {
    ContextParams,
    createContextParams,
    createMarkerParams,
    createSourceParams,
    MarkerParams,
    SourceParams
} from './arParams'

interface Config {
    container: HTMLElement
    fullscreen?: boolean
    arSourceParams?: Partial<SourceParams>
    arContextParams?: Partial<ContextParams>
}

export class Core extends THREE.EventDispatcher {
    readonly renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    })
    readonly scene: THREE.Scene = new THREE.Scene()
    readonly camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera()

    readonly canvas2D: HTMLCanvasElement = document.createElement('canvas')
    get context2D(): CanvasRenderingContext2D {
        return this.canvas2D.getContext('2d')!
    }

    private internalFullscreen: boolean = true
    get fullscreen(): boolean {
        return this.internalFullscreen
    }
    set fullscreen(value: boolean) {
        this.internalFullscreen = value
        this.onResize()
    }

    private container: HTMLElement
    private ready: boolean = false

    readonly arToolkitSource: any
    readonly arToolkitContext: any

    get arSourceVideo(): HTMLVideoElement {
        return this.arToolkitSource.domElement
    }
    get aspectRaito(): number {
        return this.arSourceVideo.videoWidth / this.arSourceVideo.videoHeight
    }
    get canvas(): HTMLCanvasElement {
        return this.renderer.domElement
    }

    private fixedUpdateInterval?: number

    constructor(config: Config) {
        super()

        this.scene.add(this.camera)
        this.renderer.autoClear = false
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.container = this.initializeContainer(config.container)
        this.addOverlay(this.canvas2D, 0)

        this.fullscreen = config.fullscreen ?? this.fullscreen

        const { source, context } = this.initializeArToolkit(
            config.arSourceParams,
            config.arContextParams
        )
        this.arToolkitSource = source
        this.arToolkitContext = context

        let resizeTimeout: number
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimeout)
            resizeTimeout = window.setTimeout(() => this.onResize(), 1000)
        })
    }

    add(object: THREE.Object3D): void {
        this.scene.add(object)
    }

    addMarker(params: string | Partial<MarkerParams>, object: THREE.Object3D): void {
        params = typeof params === 'string' ? { patternUrl: params } : params
        params = createMarkerParams(params)
        let controls = new THREEx.ArMarkerControls(this.arToolkitContext, object, params)
        return controls
    }

    resize(width: number, height: number): void {
        if (!this.fullscreen) {
            let w = height * this.aspectRaito
            if (w <= width) {
                width = height * this.aspectRaito
            } else {
                height = width / this.aspectRaito
            }
        }

        this.arSourceVideo.style.width = this.fullscreen ? 'auto' : width + 'px'
        this.arSourceVideo.style.height = height + 'px'
        this.renderer.setSize(width, height)
        this.canvas2D.width = width
        this.canvas2D.height = height
    }

    private onResize(): void {
        if (this.ready) {
            this.resize(window.innerWidth, window.innerHeight)
        }
    }

    // flip(): void {
    //     this.container.style.transform = 'scaleX(-1)';
    //     this.scene.children[5].scale.x = -1;
    // }

    start(): void {
        this.dispatchEvent({ type: 'start' })

        this.renderer.setAnimationLoop(() => this.update())

        this.scene.traverse((child) => {
            if (child instanceof GameObject) {
                child.dispatchEvent({ type: 'message:core', message: 'start' })
            }
        })

        clearInterval(this.fixedUpdateInterval)
        this.fixedUpdateInterval = window.setInterval(() => {
            this.scene.traverse((child) => {
                if (child instanceof GameObject) {
                    child.dispatchEvent({
                        type: 'message:core',
                        message: 'fixedUpdate'
                    })
                }
            })
        }, 20)
    }

    stop(): void {
        this.renderer.setAnimationLoop(null)
        clearInterval(this.fixedUpdateInterval)
        this.dispatchEvent({ type: 'stop' })
    }

    private update(): void {
        this.arToolkitContext.update(this.arToolkitSource.domElement)
        this.scene.traverse((child) => {
            if (child instanceof GameObject) {
                child.dispatchEvent({
                    type: 'message:core',
                    message: 'update'
                })
            }
        })

        this.renderer.clear()
        this.renderer.setViewport(0, 0, this.canvas.width, this.canvas.height)
        this.renderer.render(this.scene, this.camera)

        this.dispatchEvent({ type: 'update' })
    }

    private initializeContainer(container: HTMLElement): HTMLElement {
        container.classList.add('simple-game-engine')
        container.appendChild(this.renderer.domElement)
        return container
    }

    private addOverlay(
        child?: HTMLElement,
        zIndex: number | string = '',
        cls: string = ''
    ): HTMLDivElement {
        const overlay = document.createElement('div')
        overlay.classList.add('overlay')
        if (cls) {
            overlay.classList.add(cls)
        }
        overlay.style.zIndex = zIndex?.toString() ?? ''
        if (child) {
            overlay.appendChild(child)
        }
        this.container.appendChild(overlay)
        return overlay
    }

    private initializeArToolkit(
        sourceParmas?: Partial<SourceParams>,
        contextParmas?: Partial<ContextParams>
    ): any {
        let source = new THREEx.ArToolkitSource(createSourceParams(sourceParmas))
        let context = new THREEx.ArToolkitContext(createContextParams(contextParmas))

        source.init(() => {
            this.arSourceVideo.style.cssText = ''
            this.addOverlay(this.arSourceVideo, -1, 'ar-video--overlay')
            this.arSourceVideo.addEventListener('loadedmetadata', () => {
                this.camera.aspect = this.aspectRaito
                this.camera.updateProjectionMatrix()
                this.onResize()
            })
            this.ready = true
            this.onResize()
        })

        context.init(() => {
            const matrix = this.arToolkitContext.getProjectionMatrix()
            // this.camera.aspect = matrix.elements[5] / matrix.elements[0];
            this.camera.fov = (2.0 * Math.atan(1.0 / matrix.elements[5]) * 180.0) / Math.PI
            this.camera.near = matrix.elements[14] / (matrix.elements[10] - 1.0)
            this.camera.far = matrix.elements[14] / (matrix.elements[10] + 1.0)
            this.camera.updateProjectionMatrix()
        })

        return { source, context }
    }
}
