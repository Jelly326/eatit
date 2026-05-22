Page({
  data: {
    food: '',
    state: 'normal' as 'normal' | 'chaos' | 'terminal',
    jumpX: 0,
    jumpY: 0,
    jumpRotate: 0,
  },

  _chaosTimer: 0 as number,

  onLoad(options: Record<string, string | undefined>) {
    if (options.food) {
      this.setData({ food: decodeURIComponent(options.food) });
    }
  },

  onUnload() {
    this.stopChaos();
  },

  onAccept() {
    wx.navigateBack();
  },

  onRetry() {
    this.startChaos();
  },

  startChaos() {
    this.setData({ state: 'chaos' });
    this.scheduleJump();
  },

  stopChaos() {
    if (this._chaosTimer) {
      clearTimeout(this._chaosTimer);
      this._chaosTimer = 0;
    }
  },

  scheduleJump() {
    const delay = 400 + Math.random() * 300;
    this._chaosTimer = setTimeout(() => {
      const x = Math.round((Math.random() - 0.5) * 200);
      const y = Math.round((Math.random() - 0.5) * 300);
      const rotate = Math.round((Math.random() - 0.5) * 30);
      this.setData({ jumpX: x, jumpY: y, jumpRotate: rotate });
      this.scheduleJump();
    }, delay) as unknown as number;
  },

  onCatchJumpBtn() {
    this.stopChaos();
    this.setData({ state: 'terminal' });
  },
});
