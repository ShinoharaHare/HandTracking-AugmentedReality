import './MIDI.min.js'
import './Base64binary.js'

const MIDI: any = window.MIDI;

type NoteLike = number | string;

class MIDIPlayer {
    private static instanceInternal = new MIDIPlayer();
    static get instance() { return MIDIPlayer.instanceInternal };

    private readyInternal = false;
    private get ready() { return this.readyInternal };

    private constructor() {
        MIDI.loadPlugin({
            soundfontUrl: '/midi/',
            instrument: 'acoustic_grand_piano',
            onsuccess: () => this.readyInternal = true
        });
    }

    noteOn(channel: number, note: NoteLike, dynamic: number, delay = 0) {
        if (this.ready) {
            MIDI.noteOn(channel, this.toNote(note), dynamic, delay);
        }
    }

    noteOff(channel: number, note: NoteLike, delay = 0) {
        if (this.ready) {
            MIDI.noteOff(channel, this.toNote(note), delay);
        }
    }

    toNote(note: NoteLike) {
        if (typeof note === 'string') {
            if (note.includes('#')) {
                note = note.replace('#', '');
                return MIDI.keyToNote[note] + 1;
            } else {
                return MIDI.keyToNote[note];
            }
        }
        return note;
    }
}

export const midiPlayer = MIDIPlayer.instance;
