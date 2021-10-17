import * as THREE from 'three'
import { GameObject, MonoBehaviour } from '../augmented_reality'
import { Handedness } from '../hand_tracking'
import { Hand } from './Hand'
import { Keyboard } from './Keyboard'

class KHBehaviour extends MonoBehaviour {
    private raycaster: THREE.Raycaster = new THREE.Raycaster()
    private v: THREE.Vector3 = new THREE.Vector3()
    private q: THREE.Quaternion = new THREE.Quaternion()
    private down: THREE.Vector3 = new THREE.Vector3()

    get kh() {
        return this.gameObject as KH
    }
    get keyboard() {
        return this.kh.keyboard
    }
    get leftHand() {
        return this.kh.leftHand
    }
    get rightHand() {
        return this.kh.rightHand
    }

    constructor(kh: KH) {
        super(kh)
    }

    private xPoolLeft: number[] = []
    private yPoolLeft: number[] = []
    updateLeftHand(x: number, y: number) {
        this.xPoolLeft.push(x)
        this.yPoolLeft.push(y)

        if (this.xPoolLeft.length > 5) {
            this.xPoolLeft.shift()
            this.yPoolLeft.shift()
            this.leftHand.position.x =
                this.xPoolLeft.reduce((a, b) => a + b) / this.xPoolLeft.length
            this.leftHand.position.z =
                this.yPoolLeft.reduce((a, b) => a + b) / this.yPoolLeft.length
        } else {
            this.leftHand.position.x = x
            this.leftHand.position.z = y
        }
    }

    private xPooRight: number[] = []
    private yPoolRight: number[] = []
    updateRightHand(x: number, y: number) {
        this.xPooRight.push(x)
        this.yPoolRight.push(y)

        if (this.xPooRight.length > 5) {
            this.xPooRight.shift()
            this.yPoolRight.shift()
            this.rightHand.position.x =
                this.xPooRight.reduce((a, b) => a + b) / this.xPooRight.length
            this.rightHand.position.z =
                this.yPoolRight.reduce((a, b) => a + b) / this.yPoolRight.length
        } else {
            this.rightHand.position.x = x
            this.rightHand.position.z = y
        }
    }

    updateHandPosition(handedeness: Handedness, x: number, y: number) {
        const hand =
            handedeness === Handedness.Left ? this.leftHand : this.rightHand
    }

    update() {
        if (this.kh.leftHand.isModelLoaded) {
            this.updateOneHand(this.leftHand)
        }

        if (this.kh.rightHand.isModelLoaded) {
            this.updateOneHand(this.rightHand)
        }
    }

    private updateOneHand(hand: Hand) {
        for (let i = 5; i < 15; i += 3) {
            hand.bones[i].getWorldPosition(this.v)
            hand.getWorldQuaternion(this.q)
            this.down.set(0, -1, 0).applyQuaternion(this.q)
            this.raycaster.set(this.v, this.down)
            let intersect = this.raycaster.intersectObjects(
                this.keyboard.meshes
            )[0]
            const angleData = hand.behavior.angleData
            let pressed =
                angleData.getByIndex(i - 1) > THREE.MathUtils.degToRad(0)
            pressed =
                pressed &&
                angleData.getByIndex(i) > THREE.MathUtils.degToRad(15)
            pressed =
                pressed &&
                angleData.getByIndex(i + 1) > THREE.MathUtils.degToRad(0)

            if (intersect && pressed) {
                const keyName = intersect.object.name
                let index = parseInt(keyName.substr(3, 2))
                this.keyboard.behavior.pressKey(index)
            }
        }
    }
}

export class KH extends GameObject {
    readonly keyboard: Keyboard = new Keyboard()
    readonly leftHand: Hand = new Hand(Handedness.Left)
    readonly rightHand: Hand = new Hand(Handedness.Right)
    readonly behavior: KHBehaviour = new KHBehaviour(this)
    readonly leftHandCamera: THREE.Camera = new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1
    )

    constructor() {
        super()

        this.position.set(0, 0, -2.75)
        this.keyboard.rotation.set(0.8, 0, 0)
        this.leftHand.scale.multiplyScalar(0.4)
        this.leftHand.position.set(-0.25, 0.3, 0.5)

        this.rightHand.scale.multiplyScalar(0.4)
        this.rightHand.position.set(0.25, 0.3, 0.5)
        // this.leftHand.opacity = 0.5

        window.keyboard = this.keyboard
        window.leftHand = this.leftHand
        window.rightHand = this.rightHand
        window.leftHandCamera = this.leftHandCamera

        // this.add(new THREE.AxesHelper())

        let v = new THREE.Vector3()
        this.leftHandCamera.position.set(0, -0.3, 0)
        // this.leftHandCamera.lookAt(this.leftHand.getWorldPosition(v));
        this.leftHand.add(this.leftHandCamera)

        this.add(this.keyboard)
        this.keyboard.add(this.leftHand)
        this.keyboard.add(this.rightHand)
    }
}
