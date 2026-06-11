import { GifEncoder } from './gifEncoder.js';

/**
 * アニメーションをGIFとして録画・保存する機能
 * Canvasのアニメーション再生をフレーム単位でキャプチャし、GIFに変換する
 */
export class GifRecorder {
  constructor(state, canvas, animation) {
    this.state = state;
    this.canvas = canvas;
    this.animation = animation;
    this.recording = false;
    this.gifWidth = 640;
    this.gifHeight = 1020;
    this.fps = 30;
    this.onProgress = null;
  }

  isRecording() {
    return this.recording;
  }

  /**
   * アニメーションをGIFとして録画・保存する
   */
  async record() {
    if (this.state.steps.length < 2) {
      throw new Error('Generating GIFs requires two or more steps');
    }

    if (this.recording) {
      throw new Error('Already recording');
    }

    this.recording = true;

    try {
      const frames = await this.captureFrames();
      const gifData = this.encodeGif(frames);
      this.download(gifData);
    } finally {
      this.recording = false;
    }
  }

  /**
   * 全ステップ間のトゥイーンをフレームキャプチャする
   */
  async captureFrames() {
    const frames = [];
    const steps = this.state.steps;
    const tweenDuration = this.animation.tweenDuration;
    const pauseDuration = this.animation.pauseDuration;
    const frameInterval = 1000 / this.fps;

    // オフスクリーンキャンバスを作成
    const offscreen = document.createElement('canvas');
    offscreen.width = this.gifWidth;
    offscreen.height = this.gifHeight;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    const scale = this.gifWidth / this.canvas.width;

    // 最初のステップの静止フレームを追加（一定時間停止）
    const firstStepObjects = JSON.parse(JSON.stringify(steps[0].objects));
    const firstStepComments = JSON.parse(JSON.stringify(steps[0].comments || []));
    const pauseFrames = Math.ceil(pauseDuration / frameInterval);

    // 元の状態を保存
    const savedObjects = JSON.parse(JSON.stringify(this.state.objects));
    const savedComments = JSON.parse(JSON.stringify(this.state.comments));
    const savedIndex = this.state.currentStepIndex;
    const savedIsTweening = this.state.isTweening;

    this.state.objects = firstStepObjects;
    this.state.comments = firstStepComments;
    this.state.currentStepIndex = 0;
    this.state.isTweening = false;

    this.canvas.draw();
    for (let p = 0; p < pauseFrames; p++) {
      this.captureCanvasFrame(offscreen, offCtx, scale, frames);
    }

    const totalStepTransitions = steps.length - 1;

    // 各ステップ間のトゥイーンをキャプチャ
    for (let stepIdx = 0; stepIdx < totalStepTransitions; stepIdx++) {
      const fromObjects = JSON.parse(JSON.stringify(steps[stepIdx].objects));
      const toObjects = JSON.parse(JSON.stringify(steps[stepIdx + 1].objects));
      const toComments = JSON.parse(JSON.stringify(steps[stepIdx + 1].comments || []));

      const totalFrames = Math.ceil(tweenDuration / frameInterval);

      this.state.isTweening = true;
      this.state.currentStepIndex = stepIdx + 1;

      for (let frame = 0; frame <= totalFrames; frame++) {
        const progress = Math.min(frame / totalFrames, 1);
        const easedProgress = this.animation.easeInOutQuad(progress);

        this.state.objects = this.animation.interpolateObjects(fromObjects, toObjects, easedProgress);

        // 最後のフレームでコメントを表示
        if (progress >= 1) {
          this.state.comments = toComments;
          this.state.isTweening = false;
        }

        this.canvas.draw();
        this.captureCanvasFrame(offscreen, offCtx, scale, frames);
      }

      // ステップ間の一時停止フレーム
      if (stepIdx < totalStepTransitions - 1) {
        this.state.isTweening = false;
        this.canvas.draw();
        for (let p = 0; p < pauseFrames; p++) {
          this.captureCanvasFrame(offscreen, offCtx, scale, frames);
        }
      }

      if (this.onProgress) {
        this.onProgress((stepIdx + 1) / totalStepTransitions);
      }
    }

    // 最後のステップの静止フレーム（長めに停止）
    this.state.isTweening = false;
    this.canvas.draw();
    const endPauseFrames = Math.ceil(800 / frameInterval);
    for (let p = 0; p < endPauseFrames; p++) {
      this.captureCanvasFrame(offscreen, offCtx, scale, frames);
    }

    // 状態を復元
    this.state.objects = savedObjects;
    this.state.comments = savedComments;
    this.state.currentStepIndex = savedIndex;
    this.state.isTweening = savedIsTweening;
    this.state.notifyListeners();

    return frames;
  }

  captureCanvasFrame(offscreen, offCtx, scale, frames) {
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
    offCtx.drawImage(
      this.canvas.canvas,
      0, 0, this.canvas.canvas.width, this.canvas.canvas.height,
      0, 0, offscreen.width, offscreen.height
    );
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    frames.push(imageData);
  }

  /**
   * キャプチャしたフレームをGIFにエンコード
   */
  encodeGif(frames) {
    const encoder = new GifEncoder(this.gifWidth, this.gifHeight);
    encoder.setDelay(Math.round(1000 / this.fps));

    for (const frame of frames) {
      encoder.addFrame(frame);
    }

    return encoder.encode();
  }

  /**
   * GIFデータをファイルとしてダウンロード
   */
  download(gifData) {
    const blob = new Blob([gifData], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactics-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
