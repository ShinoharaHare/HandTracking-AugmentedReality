import * as THREE from 'three'

import { GameObject, MonoBehaviour } from '../simple_game_engine'
import { Keyboard } from './Keyboard'
import { Hand } from './Hand'
import { Handedness, HandTrackerResult } from '../hand_tracking'

class Threshold {
    private adjustMode: boolean = true;

    private min: number[];
    private  max: number[];
    public RATIO: number = 0.4;
    private _threshold: number[];

    // ===========
    private firstTime = true;
    private start: number;
    private timeToStopAdjMode: number = 1000 * 10;
    // =========
    public name: string = "name?";

    private showAlert(message: string, fadeOut: boolean = false) {
        window.showAlert(message, fadeOut);
    }

    constructor(name: string = "Dick") {
        this.min = new Array(15).fill(99);
        this.max = new Array(15).fill(-99);
        this._threshold = new Array(15).fill(0);

        this.start = Date.now();
        this.name = name;
    }

    public setStaticMode() {
        this.adjustMode = false;
    }
    public setAdjustMode() {
        this.adjustMode = true;
    }

    public updateThreshold(index: number, angle: number): number{
        this.min[index] = Math.min(angle, this.min[index]);
        this.max[index] = Math.max(angle, this.max[index]);
        this._threshold[index] = this.max[index] * this.RATIO + this.min[index] * (1-this.RATIO);
        return this._threshold[index];
    }

    public threshold(index: number, angle: number): number {
        if(this.firstTime){
            this.start = Date.now();
            this.firstTime = false;
        }
        if(this.adjustMode){
            console.log(`%c [${this.name}]ADJ`, "color: blue");
            this.showAlert(`${this.name=="Left"?'右手':'左手'}進入校正模式`);
            if(Date.now() > (this.start + this.timeToStopAdjMode)){
                this.setStaticMode();
                console.log(`%c [${this.name}]STATIC`, "color: blue");
                this.showAlert(`${this.name=="Left"?'右手':'左手'}結束校正模式`, true);
            }
            return this.updateThreshold(index, angle);
        }else{
            return this._threshold[index];
        }
    }

    set ratio(r: number) {
        this.RATIO = r;
    }
}

class Behavior extends MonoBehaviour {
    private raycaster: THREE.Raycaster = new THREE.Raycaster()
    private v: THREE.Vector3 = new THREE.Vector3()
    private q: THREE.Quaternion = new THREE.Quaternion()
    private down: THREE.Vector3 = new THREE.Vector3()
    public LeftThreshold = new Threshold("Left");
    public RightThreshold = new Threshold("Right");

    readonly thresholds = [
        0.4056970998644829, //
        0.807897212356329,
        0.9463933229446412,
        1.032001255452633,
        0.9087469541467726
    ]

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

    start() {}

    update() {
        this.leftHand.visible = false
        this.rightHand.visible = false

        this.result?.multiHandedness?.forEach((handedness, i) => {
            let hand = handedness !== Handedness.Left ? this.leftHand : this.rightHand
            let threshold = (handedness === Handedness.Left) ? this.LeftThreshold : this.RightThreshold
            hand.visible = true
            hand.behavior.angles.set(this.result!.multiHandAngles![i])
            hand.position.x = (1-this.result!.multiSmoothLandmarks![i][0].x) * 2.5 - 1.25;  // selfi mode
            hand.position.z = this.result!.multiSmoothLandmarks![i][0].y * 2 - 1

            if (hand.isModelLoaded) {
                for (let i = 4; i < 15; i += 3) {
                    hand.bones[i].getWorldPosition(this.v)
                    hand.getWorldQuaternion(this.q)
                    this.down.set(0, -1, 0).applyQuaternion(this.q)
                    this.raycaster.set(this.v, this.down)
                    let intersect = this.raycaster.intersectObjects(this.keyboard.meshes)[0]
                    const angles = hand.behavior.angles
                    let pressed = true
                    // pressed = angles[i - 1] > THREE.MathUtils.degToRad(0)
                    // pressed = pressed && angles[i] > this.thresholds[Math.floor(i / 3)]
                    // pressed = pressed && angles[i] > threshold.threshold(i, angles[Math.floor(i / 3)]);
                    pressed = pressed && angles[i] > threshold.threshold(i, angles[i]);
                    // pressed = pressed && angles[i + 1] > THREE.MathUtils.degToRad(0)

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
