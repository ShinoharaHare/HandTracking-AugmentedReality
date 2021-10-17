import * as THREE from 'three';

export class GameObject extends THREE.Object3D {
    private readyPromise?: Promise<void>;
    private readyCallback?: () => void;
    private readyInternal: boolean = true;
    protected set ready(v: boolean) {
        if (v) {
            this.readyCallback?.();
            this.readyInternal = true;
        } else {
            this.readyPromise = new Promise(resolve => this.readyCallback = resolve);
            this.readyInternal = false;
        }
    }

    constructor() {
        super();

        this.name = this.constructor.name;
        this.addEventListener('message:core', event => this.onCoreMessage(event));
    }

    private onCoreMessage(event: THREE.Event): void {
        const message = event.message;
        switch (message) {
            case 'start':
                this.onStart();
                break;

            case 'update':
                this.onUpdate();
                break;

            case 'fixedUpdate':
                this.onFixedUpdate();
                break;

            default:
        }
    }

    private async onStart(): Promise<void> {
        await this.readyPromise;
        this.dispatchEvent({ type: 'message:behaviour', message: 'start' });
    }

    private onUpdate() {
        if (this.readyInternal) {
            this.dispatchEvent({ type: 'message:behaviour', message: 'update' });
        }
    }

    private onFixedUpdate() {
        if (this.readyInternal) {
            this.dispatchEvent({ type: 'message:behaviour', message: 'fixedUpdate' });
        }
    }
}
