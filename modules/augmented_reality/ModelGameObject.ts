import { GameObject } from './GameObject';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ModelGameObject extends GameObject {
    private loaded: boolean = false;
    get isModelLoaded(): boolean { return this.loaded; }

    constructor(readonly modelPath: string) {
        super();
        this.name = this.constructor.name;
        this.ready = false;
        this.load();
    }

    private async load(): Promise<void> {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(this.modelPath);
        this.add(gltf.scene);

        this.onLoaded();
        this.onModelLoaded();
    }

    private onLoaded(): void {
        this.loaded = true;
        this.ready = true;
    }

    protected onModelLoaded(): void { }
}