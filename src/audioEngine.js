// Procedural Web Audio Engine for Vintage Soundscape

class VintageAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.hearthNode = null;
    this.droneNode = null;
    this.masterGain = null;
    this.hearthGain = null;
    this.droneGain = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
      this.setupHearthFire();
      this.setupArcaneDrone();
    } catch (e) {
      console.warn("Web Audio not supported or failed to initialize", e);
    }
  }

  setupHearthFire() {
    if (!this.ctx) return;
    // Generate pink noise for soft fireplace whoosh
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to warm bass / hearth crackle
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.hearthGain = this.ctx.createGain();
    this.hearthGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.hearthGain);
    this.hearthGain.connect(this.masterGain);
    whiteNoise.start();

    // Periodic random wood snap/crackle
    setInterval(() => {
      if (!this.isMuted && this.ctx && this.ctx.state === 'running') {
        if (Math.random() > 0.45) {
          this.triggerWoodSnap();
        }
      }
    }, 450);
  }

  triggerWoodSnap() {
    if (!this.ctx || this.isMuted) return;
    try {
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      snapOsc.type = 'triangle';
      const startFreq = 800 + Math.random() * 1200;
      snapOsc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      snapOsc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.03);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      filter.Q.setValueAtTime(2, this.ctx.currentTime);

      const vol = 0.02 + Math.random() * 0.05;
      snapGain.gain.setValueAtTime(vol, this.ctx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      snapOsc.connect(filter);
      filter.connect(snapGain);
      snapGain.connect(this.masterGain);

      snapOsc.start();
      snapOsc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  setupArcaneDrone() {
    if (!this.ctx) return;
    // Ethereal fifth chord drone: A2 (110Hz) & E3 (164.8Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);

    osc1.connect(this.droneGain);
    osc2.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
  }

  toggleSound(forceState = null) {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (forceState !== null) {
      this.isMuted = !forceState;
    } else {
      this.isMuted = !this.isMuted;
    }

    const targetHearth = this.isMuted ? 0.0001 : 0.25;
    const targetDrone = this.isMuted ? 0.0001 : 0.08;

    if (this.hearthGain) {
      this.hearthGain.gain.setTargetAtTime(targetHearth, this.ctx.currentTime, 0.5);
    }
    if (this.droneGain) {
      this.droneGain.gain.setTargetAtTime(targetDrone, this.ctx.currentTime, 1.0);
    }

    return !this.isMuted;
  }

  playBrassClick() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playRelicInspectSound() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      // Shimmering chord on relic selection
      const freqs = [330, 440, 554.37, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

        const startTime = this.ctx.currentTime + idx * 0.04;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch (e) {}
  }

  playParchmentSound() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch (e) {}
  }
}

export const vintageAudio = new VintageAudioEngine();
