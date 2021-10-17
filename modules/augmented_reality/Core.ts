import * as THREE from 'three';
import * as THREEx from 'ar-threex';
import { GameObject } from './GameObject';
import { ContextParams, createContextParams, createMarkerParams, createSourceParams, MarkerParams, SourceParams } from './arParams';


interface Config {
    container: HTMLElement;
    fullscreen?: boolean;
    arSourceParams?: Partial<SourceParams>;
    arContextParams?: Partial<ContextParams>;
}

export class Core extends THREE.EventDispatcher {
    readonly renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    readonly scene: THREE.Scene = new THREE.Scene();
    readonly camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    private fullscreenInternel: boolean = true;
    get fullscreen(): boolean { return this.fullscreenInternel }
    set fullscreen(value: boolean) {
        this.fullscreenInternel = value;
        this.onResize();
    }

    private container: HTMLElement;
    private ready: boolean = false;

    readonly arToolkitSource: any;
    readonly arToolkitContext: any;

    get arSourceVideo(): HTMLVideoElement { return this.arToolkitSource.domElement }
    get aspectRaito(): number { return this.arSourceVideo.videoWidth / this.arSourceVideo.videoHeight }
    get canvas(): HTMLCanvasElement { return this.renderer.domElement }

    private fixedUpdateInterval?: number;

    constructor(config: Config) {
        super();

        this.scene.add(this.camera);
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container = this.initializeContainer(config.container);
        this.fullscreen = config.fullscreen ?? this.fullscreen;

        const { source, context } = this.initializeArToolkit(config.arSourceParams, config.arContextParams);
        this.arToolkitSource = source;
        this.arToolkitContext = context;

        window.addEventListener('resize', () => this.onResize())
    }

    add(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    addMarker(params: string | Partial<MarkerParams>, object: THREE.Object3D): void {
        params = typeof params === 'string' ? { patternUrl: params } : params;
        params = createMarkerParams(params);
        let controls = new THREEx.ArMarkerControls(this.arToolkitContext, object, params);
        return controls;
    }

    resizeFullscreen(): void {
        this.arSourceVideo.style.cssText = '';
        this.arSourceVideo.style.position = 'absolute';
        this.arSourceVideo.style.zIndex = '-2';
        this.container.style.position = 'fixed';

        this.arToolkitSource.onResizeElement();
        this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);

        let canvas = this.arToolkitContext.arController?.canvas
        if (canvas) {
            this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController?.canvas);
        }
        let width = parseInt(this.renderer.domElement.style.width);
        let height = parseInt(this.renderer.domElement.style.height);

        this.renderer.setSize(width, height);
    }

    resize(width: number, height: number): void {
        this.arSourceVideo.style.cssText = '';
        this.arSourceVideo.style.position = 'absolute';
        this.arSourceVideo.style.zIndex = '-2';
        this.container.style.position = 'relative';

        let w = height * this.aspectRaito;
        if (w <= width) {
            width = height * this.aspectRaito;
        } else {
            height = width / this.aspectRaito;
        }

        this.renderer.domElement.style.margin = '0';

        this.arSourceVideo.style.left = '50%';
        this.arSourceVideo.style.top = '50%';
        this.arSourceVideo.style.transform = 'translate(-50%, -50%)';
        this.arSourceVideo.width = width;
        this.arSourceVideo.height = height;

        this.renderer.setSize(width, height);
    }

    private onResize(): void {
        if (this.ready) {
            if (this.fullscreen) {
                this.resizeFullscreen();
            } else {
                this.resize(window.innerWidth, window.innerHeight);
            }
        }
    }

    // flip(): void {
    //     this.container.style.transform = 'scaleX(-1)';
    //     this.scene.children[5].scale.x = -1;
    // }

    start(): void {
        this.dispatchEvent({ type: 'start' });

        this.renderer.setAnimationLoop(() => this.update());

        this.scene.traverse(child => {
            if (child instanceof GameObject) {
                child.dispatchEvent({ type: 'message:core', message: 'start' });
            }
        })

        clearInterval(this.fixedUpdateInterval);
        this.fixedUpdateInterval = window.setInterval(() => {
            this.scene.traverse(child => {
                if (child instanceof GameObject) {
                    child.dispatchEvent({ type: 'message:core', message: 'fixedUpdate' });
                }
            })
        }, 20);
    }

    stop(): void {
        this.renderer.setAnimationLoop(null);
        clearInterval(this.fixedUpdateInterval);
        this.dispatchEvent({ type: 'stop' });
    }

    private update(): void {
        this.arToolkitContext.update(this.arToolkitSource.domElement);
        this.scene.traverse(child => {
            if (child instanceof GameObject) {
                child.dispatchEvent({ type: 'message:core', message: 'update' });
            }
        })

        this.renderer.clear();
        this.renderer.setViewport(0, 0, this.canvas.width, this.canvas.height);
        this.renderer.render(this.scene, this.camera);

        this.dispatchEvent({ type: 'update' });
    }

    private initializeContainer(element: HTMLElement): HTMLElement {
        element.appendChild(this.renderer.domElement);
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.width = '100vw';
        element.style.height = '100vh';
        return element;
    }

    private initializeArToolkit(sourceParmas?: Partial<SourceParams>, contextParmas?: Partial<ContextParams>): any {
        let source = new THREEx.ArToolkitSource(createSourceParams(sourceParmas));
        let context = new THREEx.ArToolkitContext(createContextParams(contextParmas));

        source.init(() => {
            this.container.appendChild(this.arSourceVideo);
            this.arSourceVideo.addEventListener('loadedmetadata', () => {
                this.camera.aspect = this.aspectRaito;
                this.camera.updateProjectionMatrix();
                this.onResize();
            });
            this.ready = true;
        });

        context.init(() => {
            const matrix = this.arToolkitContext.getProjectionMatrix();
            // this.camera.aspect = matrix.elements[5] / matrix.elements[0];
            this.camera.fov = 2.0 * Math.atan(1.0 / matrix.elements[5]) * 180.0 / Math.PI;
            this.camera.near = matrix.elements[14] / (matrix.elements[10] - 1.0);
            this.camera.far = matrix.elements[14] / (matrix.elements[10] + 1.0);
            this.camera.updateProjectionMatrix();
        });

        return { source, context };
    }
}
