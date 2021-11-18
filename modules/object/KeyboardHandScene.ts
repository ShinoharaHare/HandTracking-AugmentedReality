import * as THREE from 'three'

import { GameObject, MonoBehaviour } from '../simple_game_engine'
import { Keyboard } from './Keyboard'
import { Hand } from './Hand'
import { Handedness, HandTrackerResult } from '../hand_tracking'

class Behavior extends MonoBehaviour {
    private raycaster: THREE.Raycaster = new THREE.Raycaster()
    private v: THREE.Vector3 = new THREE.Vector3()
    private q: THREE.Quaternion = new THREE.Quaternion()
    private down: THREE.Vector3 = new THREE.Vector3()

    readonly thresholds: Map<Handedness, Float32Array> = new Map()

    get keyboardHandScene() {
        return this.gameObject as KeyboardHandScene
    }

    get leftHand() {
        return this.keyboardHandScene.leftHand
    }

    get rightHand() {
        return this.keyboardHandScene.rightHand
    }

    get keyboard() {
        return this.keyboardHandScene.keyboard
    }

    result?: HandTrackerResult

    start() { }

    update() {
        this.leftHand.visible = false
        this.rightHand.visible = false

        this.result?.multiHandedness?.forEach((handedness, i) => {
            let hand = handedness === Handedness.Left ? this.leftHand : this.rightHand
            hand.visible = true
            hand.behavior.angles.set(this.result!.multiHandAngles![i])
            hand.position.x = this.result!.multiSmoothLandmarks![i][0].x * 2.5 - 1.25
            hand.position.z = this.result!.multiSmoothLandmarks![i][0].y * 2 - 1

            const thresholds = this.thresholds.get(handedness)
            if (hand.isModelLoaded && thresholds) {
                for (let i = 4; i < 15; i += 3) {
                    hand.bones[i].getWorldPosition(this.v)
                    hand.getWorldQuaternion(this.q)
                    this.down.set(0, -1, 0).applyQuaternion(this.q)
                    this.raycaster.set(this.v, this.down)
                    let intersect = this.raycaster.intersectObjects(this.keyboard.meshes)[0]
                    const angles = hand.behavior.angles
                    let pressed = true
                    pressed = pressed && angles[i - 1] > thresholds[Math.floor(i / 3) - 1]
                    pressed = pressed || angles[i] > thresholds[Math.floor(i / 3)]
                    pressed = pressed && angles[i + 1] > thresholds[Math.floor(i / 3) + 1]

                    if (intersect && pressed) {
                        const keyName = intersect.object.name
                        let index = parseInt(keyName.substr(3, 2))
                        this.keyboard.behavior.pressKey(index)
                    }
                }
            }
        })
    }
}

export class KeyboardHandScene extends GameObject {
    readonly behavior = new Behavior(this)
    readonly keyboard: Keyboard = new Keyboard()
    readonly leftHand: Hand = new Hand(Handedness.Left)
    readonly rightHand: Hand = new Hand(Handedness.Right)

    constructor() {
        super()

        this.leftHand.scale.multiplyScalar(0.4)
        this.leftHand.position.set(-0.25, 0.3, 0.5)

        this.rightHand.scale.multiplyScalar(0.4)
        this.rightHand.position.set(0.25, 0.3, 0.5)

        this.keyboard.add(this.leftHand)
        this.keyboard.add(this.rightHand)
        this.add(this.keyboard)
    }
}
