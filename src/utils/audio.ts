class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialisation of AudioContext is crucial because of autoplay browser restrictions.
    this.isMuted = typeof window !== 'undefined' ? localStorage.getItem('retro_snake_muted') === 'true' : false;
  }

  private initContext(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        return true;
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser.', e);
    }
    return false;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('retro_snake_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  private createOscillator(freq: number, type: OscillatorType, duration: number, gainStartValue: number) {
    if (this.isMuted || !this.initContext() || !this.ctx) return null;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(gainStartValue, this.ctx.currentTime);
    // Linear / Exponential decay for natural retro feel
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    return { osc, gainNode };
  }

  public playClick(): void {
    const sound = this.createOscillator(600, 'triangle', 0.05, 0.1);
    if (!sound) return;
    sound.osc.start();
    sound.osc.stop(this.ctx!.currentTime + 0.05);
  }

  public playMove(): void {
    const sound = this.createOscillator(150, 'triangle', 0.04, 0.05);
    if (!sound || !this.ctx) return;
    sound.osc.start();
    sound.osc.stop(this.ctx.currentTime + 0.04);
  }

  public playEat(isQuiet: boolean = false): void {
    // Double-tone rapid sparkle/chirp
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.setValueAtTime(659.25, t + 0.06); // E5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, t); // G5
    osc2.frequency.setValueAtTime(1046.50, t + 0.06); // C6

    const vol = isQuiet ? 0.015 : 0.08;
    gainNode.gain.setValueAtTime(vol, t);
    gainNode.gain.setValueAtTime(vol, t + 0.06);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.18);
    osc2.stop(t + 0.18);
  }

  public playGoldenEat(): void {
    // Rising custom retro melody
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.45;
    const notes = [440, 554, 659, 880]; // A major arpeggio (A4, C#5, E5, A5)
    
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + index * 0.07);
      
      gain.gain.setValueAtTime(0.08, t + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + index * 0.07 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(t + index * 0.07);
      osc.stop(t + index * 0.07 + 0.15);
    });
  }

  public playObstacleHit(): void {
    // Low rumble buzz
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.25);

    gainNode.gain.setValueAtTime(0.12, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(t + 0.25);
  }

  public playGameOver(): void {
    // Sad downward arpeggio and final bass glide
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Play downward pitches
    const tones = [392.00, 311.13, 261.63, 196.00]; // G4, Eb4, C4, G3
    tones.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      
      gain.gain.setValueAtTime(0.08, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.2);
    });

    // Retro low rumbly end
    setTimeout(() => {
      const rumble = this.createOscillator(90, 'sawtooth', 0.5, 0.15);
      if (!rumble || !this.ctx) return;
      rumble.osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.45);
      rumble.osc.start();
      rumble.osc.stop(this.ctx.currentTime + 0.5);
    }, 450);
  }

  public playPowerUp(): void {
    // Energetic retro-ascending bleeps
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [330, 440, 554, 660, 880];
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      
      gain.gain.setValueAtTime(0.07, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.12);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.12);
    });
  }
}

export const sfx = new RetroAudioEngine();
