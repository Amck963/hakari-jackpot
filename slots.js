export class SlotMachine {
  constructor() {
    this.values = [0, 0, 0];
    this.rolling = false;
    this.finished = false;
    this.jackpot = false;
    this.rollDuration = 2500;
    this.updateInterval = 70;
    this.startTime = 0;
    this.lastUpdate = 0;
  }

  start() {
    this.values = [0, 0, 0];
    this.rolling = true;
    this.finished = false;
    this.jackpot = false;
    this.startTime = performance.now();
    this.lastUpdate = 0;
  }

  update(now) {
    if (!this.rolling) return;

    if (now - this.lastUpdate >= this.updateInterval) {
      this.values = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ];
      this.lastUpdate = now;
    }

    if (now - this.startTime >= this.rollDuration) {
      this.rolling = false;
      this.finished = true;

      const shouldJackpot = Math.random() < 0.4;

      if (shouldJackpot) {
        const n = Math.floor(Math.random() * 10);
        this.values = [n, n, n];
        this.jackpot = true;
      } else {
        do {
          this.values = [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
          ];
        } while (this.values[0] === this.values[1] && this.values[1] === this.values[2]);

        this.jackpot = false;
      }
    }
  }

  reset() {
    this.values = [0, 0, 0];
    this.rolling = false;
    this.finished = false;
    this.jackpot = false;
  }
}