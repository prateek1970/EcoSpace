// public/js/soundboard.js
// Native Web Audio API Synthesizer for EchoSpace Live Soundboard

class AcousticSoundboard {
  constructor() {
    this.audioCtx = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  // Generate synthetic acoustic sound tone
  playTone(freq, type = 'sine', duration = 0.5) {
    this.initContext();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    
    // Smooth decay envelope
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  triggerPad(padName) {
    const padFrequencies = {
      'guitar-g': { freq: 196.00, type: 'triangle', dur: 1.2 },
      'guitar-c': { freq: 261.63, type: 'triangle', dur: 1.2 },
      'guitar-d': { freq: 293.66, type: 'triangle', dur: 1.2 },
      'kick':     { freq: 60.00,  type: 'sine',     dur: 0.3 },
      'snare':    { freq: 220.00, type: 'square',   dur: 0.15 },
      'vocal-fx': { freq: 440.00, type: 'sine',     dur: 0.8 },
    };

    const sound = padFrequencies[padName];
    if (sound) this.playTone(sound.freq, sound.type, sound.dur);
  }
}

window.jamBoard = new AcousticSoundboard();
