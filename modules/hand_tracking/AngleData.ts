enum Finger {
    Thumb,
    Index,
    Middle,
    Ring,
    Pinky
}

enum Knucle {
    Proximal,
    Intermediate,
    Distal
}

export class AngleData {
    private data: Float32Array = new Float32Array(15)

    get(finger: Finger, knuckle: Knucle): number {
        return this.data[finger * 3 + knuckle]
    }

    set(finger: Finger, knuckle: Knucle, value: number): void {
        this.data[finger * 3 + knuckle] = value
    }

    copy(angleData: AngleData): this {
        this.data.set(angleData.data)
        return this
    }

    getByIndex(index: number): number {
        return this.data[index]
    }

    setByIndex(index: number, value: number): void {
        this.data[index] = value
    }

    add(other: AngleData): this {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] += other.data[i]
        }
        return this
    }

    divideScalar(v: number): this {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] /= v
        }
        return this
    }

    zero(): this {
        this.data.fill(0)
        return this
    }

    toJSON(): string {
        return JSON.stringify(Array.from(this.data))
    }
}
