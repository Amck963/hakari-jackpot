export class AudioManager {
  constructor() {
    this.domainAudio = new Audio("assets/domainreal.mp3");
    this.jackpotAudio = new Audio("assets/jackpot.mp3");

    this.domainAudio.preload = "auto";
    this.jackpotAudio.preload = "auto";
    this.jackpotAudio.loop = false;

    this.domainAudio.volume = 1;
    this.jackpotAudio.volume = 1;
  }

  unlock() {
    this.domainAudio.volume = 1;
    this.jackpotAudio.volume = 1;
  }

  playDomain() {
    this.domainAudio.pause();
    this.domainAudio.currentTime = 0;
    this.domainAudio.play().catch(() => {});
  }

  playJackpot() {
    this.jackpotAudio.pause();
    this.jackpotAudio.currentTime = 0;
    this.jackpotAudio.play().catch(() => {});
  }

  stopJackpot() {
    this.jackpotAudio.pause();
    this.jackpotAudio.currentTime = 0;
  }

  isJackpotPlaying() {
    return !this.jackpotAudio.paused && !this.jackpotAudio.ended;
  }
}