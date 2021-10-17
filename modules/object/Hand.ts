import { ModelGameObject, MonoBehaviour } from '../augmented_reality'
import { Handedness, AngleData } from '../hand_tracking'

const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']

class HandBehavior extends MonoBehaviour {
    readonly angleData: AngleData = new AngleData()
    public angles2: Float32Array = new Float32Array(5) // 手指張開的角度

    get hand(): Hand {
        return this.gameObject as Hand
    }

    constructor(hand: Hand) {
        super(hand)
    }

    update() {
        for (let i = 1; i < 15; i++) {
            this.hand.bones[i].rotation.x = -this.angleData.getByIndex(i)
        }
        // 手指張開的角度 (暫時排除拇指)
        for (let i = 1; i < 5; i++) {
            this.hand.bones[i * 3].rotation.z = this.angles2[i]
        }
    }
}

export class Hand extends ModelGameObject {
    readonly behavior: HandBehavior = new HandBehavior(this)
    readonly bones: THREE.Bone[] = []

    private handednessInternal: Handedness = Handedness.Left

    get handedness(): Handedness {
        return this.handednessInternal
    }
    set handedness(handedness: Handedness) {
        this.handednessInternal = handedness
        this.onChangeHandedness()
    }

    private opacityInternal: number = 1.0

    get opacity(): number {
        return this.opacityInternal
    }
    set opacity(opacity: number) {
        this.opacityInternal = opacity
        this.onChangeOpacity()
    }

    constructor(handedeness: Handedness = Handedness.Left) {
        super('models/hand.glb')

        this.name = this.constructor.name
        this.handedness = handedeness
    }

    protected onModelLoaded() {
        this.getBones()
        this.onChangeHandedness()
        this.onChangeOpacity()
    }

    private getBones() {
        for (let finger of fingerNames) {
            for (let i = 1; i <= 3; i++) {
                let bone = this.getObjectByName(`${finger}${i}`) as THREE.Bone
                this.bones.push(bone)
            }
        }
    }

    private onChangeHandedness() {
        if (this.isModelLoaded) {
            let root = this.getObjectByName('Armature')!
            root.scale.y =
                Math.abs(root.scale.y) *
                (this.handedness === Handedness.Left ? 1 : -1)
        }
    }

    private onChangeOpacity() {
        if (this.isModelLoaded) {
            let mesh = this.getObjectByName('Armature')!.getObjectByName(
                'Hand'
            ) as THREE.SkinnedMesh
            let material = mesh.material as THREE.MeshStandardMaterial
            material.opacity = this.opacity
        }
    }
}
