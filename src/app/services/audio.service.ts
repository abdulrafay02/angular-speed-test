import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  
  private humOscillator: OscillatorNode | null = null;
  private subOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  
  private shiftInterval: any = null;

  private initContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Creates a heavy distortion curve for straight-pipe exhaust sound
  private makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))) * 4; // Multiplied by 4 to restore volume lost to distortion
    }
    return curve;
  }

  playHover() {
    this.initContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1500, this.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.02, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.03);
  }

  playBeep() {
    this.initContext();
    if (!this.audioCtx) return;

    // Engine Crank (Starter motor)
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const now = this.audioCtx.currentTime;
    
    osc.frequency.setValueAtTime(30, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.1);
    osc.frequency.linearRampToValueAtTime(30, now + 0.2);
    osc.frequency.linearRampToValueAtTime(40, now + 0.3);
    
    // Ignition and Rev up
    osc.frequency.linearRampToValueAtTime(150, now + 0.5); 
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.9);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1); 
    gain.gain.linearRampToValueAtTime(0.4, now + 0.5); 
    gain.gain.linearRampToValueAtTime(0, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  playCompleteBeep() {
    this.initContext();
    if (!this.audioCtx) return;

    // Subtle metallic click (Key-off)
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  startHum() {
    this.initContext();
    if (!this.audioCtx) return;
    this.stopHum();

    const now = this.audioCtx.currentTime;

    // --- RB26 Engine ---
    this.humOscillator = this.audioCtx.createOscillator();
    this.subOscillator = this.audioCtx.createOscillator();
    this.humGain = this.audioCtx.createGain();
    
    // Detuned sawtooths create a mechanical phase beating (chorus) effect that sounds much more organic
    this.humOscillator.type = 'sawtooth';
    this.subOscillator.type = 'sawtooth';
    
    // Idle around 50Hz (approx 1000 RPM on a 6cyl)
    this.humOscillator.frequency.setValueAtTime(50, now);
    this.humOscillator.frequency.linearRampToValueAtTime(350, now + 3.5); 
    
    // Slightly detuned to simulate physical engine variation
    this.subOscillator.frequency.setValueAtTime(51.5, now);
    this.subOscillator.frequency.linearRampToValueAtTime(356, now + 3.5);

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now); // Muffled at idle
    filter.frequency.linearRampToValueAtTime(1200, now + 3.5); // Opens up loudly at high RPM
    filter.Q.value = 2; // Slight resonance for exhaust pipe character

    const hpFilter = this.audioCtx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(40, now); // Remove muddy sub frequencies

    this.humGain.gain.setValueAtTime(0, now);
    this.humGain.gain.linearRampToValueAtTime(0, now + 0.5); // wait for crank
    this.humGain.gain.linearRampToValueAtTime(0.8, now + 1.0); // Loud and clear

    this.humOscillator.connect(filter);
    this.subOscillator.connect(filter);
    filter.connect(hpFilter);
    hpFilter.connect(this.humGain);
    this.humGain.connect(this.audioCtx.destination);
    
    this.humOscillator.start(now);
    this.subOscillator.start(now);

    // --- Enhanced Turbo Spool ---
    this.turboOsc = this.audioCtx.createOscillator();
    this.turboGain = this.audioCtx.createGain();
    this.turboOsc.type = 'sine';

    this.turboOsc.frequency.setValueAtTime(1000, now);
    this.turboOsc.frequency.exponentialRampToValueAtTime(6000, now + 3.5); 

    this.turboGain.gain.setValueAtTime(0, now);
    this.turboGain.gain.linearRampToValueAtTime(0, now + 1.0); 
    this.turboGain.gain.linearRampToValueAtTime(0.04, now + 3.0); 

    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.audioCtx.destination);
    this.turboOsc.start(now);

    this.shiftInterval = setInterval(() => this.executeGearShift(), 3500);
  }

  private executeGearShift() {
    if (!this.audioCtx || !this.humOscillator || !this.turboOsc || !this.turboGain || !this.humGain) return;
    
    const now = this.audioCtx.currentTime;
    
    // 1. STUTUTUTU
    this.playStutututu(now);

    // 2. RPM Drops (shift gear)
    try { this.humOscillator.frequency.cancelScheduledValues(now); } catch(e){}
    try { this.subOscillator?.frequency.cancelScheduledValues(now); } catch(e){}

    this.humOscillator.frequency.setValueAtTime(350, now);
    this.humOscillator.frequency.exponentialRampToValueAtTime(120, now + 0.3);
    // Rev back up over the next interval
    this.humOscillator.frequency.linearRampToValueAtTime(350, now + 3.5);

    if (this.subOscillator) {
      this.subOscillator.frequency.setValueAtTime(356, now);
      this.subOscillator.frequency.exponentialRampToValueAtTime(122, now + 0.3);
      this.subOscillator.frequency.linearRampToValueAtTime(356, now + 3.5);
    }

    // 3. Turbo dump
    try { this.turboOsc.frequency.cancelScheduledValues(now); } catch(e){}
    this.turboOsc.frequency.setValueAtTime(6000, now);
    this.turboOsc.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
    this.turboOsc.frequency.exponentialRampToValueAtTime(6000, now + 3.5);

    try { this.turboGain.gain.cancelScheduledValues(now); } catch(e){}
    this.turboGain.gain.setValueAtTime(this.turboGain.gain.value, now);
    this.turboGain.gain.linearRampToValueAtTime(0, now + 0.1);
    this.turboGain.gain.linearRampToValueAtTime(0.04, now + 1.5);
  }

  stopHum() {
    if (this.shiftInterval) {
      clearInterval(this.shiftInterval);
      this.shiftInterval = null;
    }
    
    if (this.humGain && this.audioCtx && this.humOscillator) {
      const now = this.audioCtx.currentTime;
      
      this.humGain.gain.cancelScheduledValues(now);
      this.humGain.gain.setValueAtTime(this.humGain.gain.value, now);
      this.humGain.gain.linearRampToValueAtTime(0, now + 0.1);

      if (this.turboGain) {
        this.turboGain.gain.cancelScheduledValues(now);
        this.turboGain.gain.setValueAtTime(this.turboGain.gain.value, now);
        this.turboGain.gain.linearRampToValueAtTime(0, now + 0.1);
      }

      this.playStutututu(now);

      // Spin down
      const spinOsc = this.audioCtx.createOscillator();
      const spinGain = this.audioCtx.createGain();
      spinOsc.type = 'sine'; // Use sine to prevent low-frequency clipping/buzz
      
      spinOsc.frequency.setValueAtTime(this.humOscillator?.frequency.value || 200, now);
      spinOsc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
      
      spinGain.gain.setValueAtTime(this.humGain.gain.value || 0.6, now);
      spinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // Fade out quicker
      
      spinOsc.connect(spinGain);
      spinGain.connect(this.audioCtx.destination);
      
      spinOsc.start(now);
      spinOsc.stop(now + 1.0);
      
      const oldHumOsc = this.humOscillator;
      const oldSubOsc = this.subOscillator;
      const oldTurboOsc = this.turboOsc;
      setTimeout(() => {
        if (oldHumOsc) { try { oldHumOsc.stop(); oldHumOsc.disconnect(); } catch(e) {} }
        if (oldSubOsc) { try { oldSubOsc.stop(); oldSubOsc.disconnect(); } catch(e) {} }
        if (oldTurboOsc) { try { oldTurboOsc.stop(); oldTurboOsc.disconnect(); } catch(e) {} }
      }, 150);

      this.humOscillator = null;
      this.subOscillator = null;
      this.humGain = null;
      this.turboOsc = null;
      this.turboGain = null;
    }
  }

  private playStutututu(now: number) {
    if (!this.audioCtx) return;

    // We use a combination of White Noise and a high-frequency Sine wave to simulate compressed air flutter
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // White noise
    }
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const whistle = this.audioCtx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(4500, now);
    whistle.frequency.exponentialRampToValueAtTime(1000, now + 1.5);

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    filter.Q.value = 12; // High resonance for the 'whistle' characteristic

    const envelope = this.audioCtx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.7, now + 0.03); // Massive volume increase for the initial burst
    envelope.gain.linearRampToValueAtTime(0.35, now + 0.6); // Hold much louder to let flutter be heard over engine
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Final decay

    // Flutter LFO
    const chopper = this.audioCtx.createOscillator();
    chopper.type = 'square'; // Square wave for sharp, distinct gaps between the 'tu' sounds
    chopper.frequency.setValueAtTime(14, now); // Start fast
    chopper.frequency.linearRampToValueAtTime(5, now + 1.5); // Slow down as pressure drops

    const tremoloGain = this.audioCtx.createGain();
    tremoloGain.gain.value = 0.5; // 50% modulation depth

    const amGain = this.audioCtx.createGain();
    amGain.gain.value = 0.5; // Base volume is 50%, so it oscillates perfectly between 0 and 100%
    
    chopper.connect(tremoloGain);
    tremoloGain.connect(amGain.gain);

    // Route both noise and whistle into the filter
    noise.connect(filter);
    whistle.connect(filter);
    
    filter.connect(envelope);
    envelope.connect(amGain);
    amGain.connect(this.audioCtx.destination);

    chopper.start(now);
    chopper.stop(now + 1.5);
    noise.start(now);
    noise.stop(now + 1.5);
    whistle.start(now);
    whistle.stop(now + 1.5);
  }
}
