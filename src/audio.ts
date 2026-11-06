// Web Audio API sound synthesis for 3D Chess
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMove() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Gentle wooden knock sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext could be blocked by browser policy before first interaction
    }
  }

  playCapture() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Heavier strike with snap
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3, now);

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(300, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.onended = () => {
        try {
          osc1.disconnect();
          osc2.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.18);
      osc2.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  playCheck() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Alert chime (double chord)
      [440, 659.25].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.3, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  playCheckmate() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Grand celebratory / solemn chord progression
      const notes = [329.63, 440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.35, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.8);
      });
    } catch {
      // ignore
    }
  }

  playCastle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Sliding castle sound: two sequential move sounds
      this.playMove();
      setTimeout(() => this.playMove(), 120);
    } catch {
      // ignore
    }
  }

  playSelect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
