export class Animation {
  constructor(state, canvas) {
    this.state = state;
    this.canvas = canvas;
    this.playing = false;
    this.animationFrameId = null;
    this.tweenDuration = 1500; // msec
    this.pauseDuration = 700;

    this.tweening = false;
    this.tweenStartTime = null;
    this.tweenProgress = 0;
    this.fromStep = null;
    this.toStep = null;
  }

  play() {
    if (this.state.steps.length === 0) return;
    if (this.tweening) return;

    this.playing = true;

    if (this.state.currentStepIndex >= this.state.steps.length - 1) {
      this.state.currentStepIndex = -1;
    } else if (this.state.currentStepIndex >= 0) {
      // 現在のステップのデータを正しく読み込む（スライダー移動後の状態を確実に同期）
      const currentStep = this.state.steps[this.state.currentStepIndex];
      this.state.objects = JSON.parse(JSON.stringify(currentStep.objects));
      this.state.comments = JSON.parse(JSON.stringify(currentStep.comments || []));
    }

    this.startTweenToNextStep();
  }

  pause() {
    this.playing = false;
    this.tweening = false;
    this.state.isTweening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop() {
    this.pause();
  }

  toggle() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
    return this.playing;
  }

  startTweenToNextStep() {
    if (!this.playing) return;

    const nextIndex = this.state.currentStepIndex + 1;

    if (nextIndex >= this.state.steps.length) {
      this.stop();
      this.state.loadStep(0);
      return;
    }

    if (this.state.currentStepIndex >= 0 && this.state.currentStepIndex < this.state.steps.length) {
      this.state.steps[this.state.currentStepIndex] = {
        stepId: this.state.steps[this.state.currentStepIndex].stepId,
        timestamp: this.state.steps[this.state.currentStepIndex].timestamp,
        objects: JSON.parse(JSON.stringify(this.state.objects)),
        comments: JSON.parse(JSON.stringify(this.state.comments))
      };
    }

    this.tweening = true;
    this.state.isTweening = true;
    this.tweenStartTime = performance.now();
    this.fromStep = this.state.currentStepIndex >= 0 ?
      JSON.parse(JSON.stringify(this.state.steps[this.state.currentStepIndex].objects)) :
      [];
    this.toStep = JSON.parse(JSON.stringify(this.state.steps[nextIndex].objects));
    this.state.currentStepIndex = nextIndex;

    this.animateTween();
  }

  animateTween() {
    if (!this.tweening) return;

    const now = performance.now();
    const elapsed = now - this.tweenStartTime;
    this.tweenProgress = Math.min(elapsed / this.tweenDuration, 1);

    const easedProgress = this.easeInOutQuad(this.tweenProgress);

    this.state.objects = this.interpolateObjects(this.fromStep, this.toStep, easedProgress);
    this.state.notifyListeners();

    if (this.tweenProgress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this.animateTween());
    } else {
      this.tweening = false;
      this.state.isTweening = false;
      this.state.objects = JSON.parse(JSON.stringify(this.toStep));

      const currentStep = this.state.steps[this.state.currentStepIndex];
      if (currentStep) {
        this.state.comments = JSON.parse(JSON.stringify(currentStep.comments || []));
      }

      this.state.notifyListeners();

      if (this.playing) {
        setTimeout(() => this.startTweenToNextStep(), this.pauseDuration);
      }
    }
  }

  interpolateObjects(fromObjects, toObjects, progress) {
    const result = [];

    toObjects.forEach(toObj => {
      const fromObj = fromObjects.find(obj => obj.id === toObj.id);

      if (fromObj) {
        result.push({
          ...toObj,
          x: this.lerp(fromObj.x, toObj.x, progress),
          y: this.lerp(fromObj.y, toObj.y, progress),
          direction: this.lerpAngle(fromObj.direction || 0, toObj.direction || 0, progress)
        });
      } else {
        const appearProgress = Math.max(0, (progress - 0.5) * 2);
        result.push({
          ...toObj,
          radius: toObj.radius * this.easeOutBack(appearProgress)
        });
      }
    });

    fromObjects.forEach(fromObj => {
      if (!toObjects.find(obj => obj.id === fromObj.id)) {
        const disappearProgress = Math.min(1, progress * 2);
        result.push({
          ...fromObj,
          radius: fromObj.radius * (1 - this.easeInCubic(disappearProgress))
        });
      }
    });

    return result;
  }

  lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  lerpAngle(start, end, progress) {
    let diff = end - start;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return start + diff * progress;
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeInCubic(t) {
    return t * t * t;
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  nextStep() {
    if (this.tweening) return;
    if (this.state.currentStepIndex < this.state.steps.length - 1) {
      if (this.state.currentStepIndex >= 0) {
        this.state.steps[this.state.currentStepIndex] = {
          stepId: this.state.steps[this.state.currentStepIndex].stepId,
          timestamp: this.state.steps[this.state.currentStepIndex].timestamp,
          objects: JSON.parse(JSON.stringify(this.state.objects)),
          comments: JSON.parse(JSON.stringify(this.state.comments))
        };
      }

      this.tweening = true;
      this.state.isTweening = true;
      this.tweenStartTime = performance.now();
      this.fromStep = JSON.parse(JSON.stringify(this.state.objects));
      this.toStep = JSON.parse(JSON.stringify(this.state.steps[this.state.currentStepIndex + 1].objects));
      this.state.currentStepIndex++;
      this.animateTween();
    }
  }

  prevStep() {
    if (this.tweening) return;
    if (this.state.currentStepIndex > 0) {
      if (this.state.currentStepIndex >= 0) {
        this.state.steps[this.state.currentStepIndex] = {
          stepId: this.state.steps[this.state.currentStepIndex].stepId,
          timestamp: this.state.steps[this.state.currentStepIndex].timestamp,
          objects: JSON.parse(JSON.stringify(this.state.objects)),
          comments: JSON.parse(JSON.stringify(this.state.comments))
        };
      }

      this.tweening = true;
      this.state.isTweening = true;
      this.tweenStartTime = performance.now();
      this.fromStep = JSON.parse(JSON.stringify(this.state.objects));
      this.toStep = JSON.parse(JSON.stringify(this.state.steps[this.state.currentStepIndex - 1].objects));
      this.state.currentStepIndex--;
      this.animateTween();
    }
  }

  goToStep(index) {
    if (index >= 0 && index < this.state.steps.length && index !== this.state.currentStepIndex) {
      // 再生中・トゥイーン中の場合は停止してから移動
      const wasTweening = this.tweening;
      if (this.playing || this.tweening) {
        this.pause();
      }

      // トゥイーン中だった場合、state.objectsが中間補間状態のため
      // ステップデータとして保存せず、保存済みデータから遷移元を取得する
      if (!wasTweening && this.state.currentStepIndex >= 0 && this.state.currentStepIndex < this.state.steps.length) {
        this.state.steps[this.state.currentStepIndex] = {
          stepId: this.state.steps[this.state.currentStepIndex].stepId,
          timestamp: this.state.steps[this.state.currentStepIndex].timestamp,
          objects: JSON.parse(JSON.stringify(this.state.objects)),
          comments: JSON.parse(JSON.stringify(this.state.comments))
        };
      }

      // 遷移元は保存済みステップデータを使用する（中間状態の混入を防ぐ）
      const fromIndex = this.state.currentStepIndex;
      const fromObjects = (fromIndex >= 0 && fromIndex < this.state.steps.length)
        ? JSON.parse(JSON.stringify(this.state.steps[fromIndex].objects))
        : JSON.parse(JSON.stringify(this.state.objects));

      this.tweening = true;
      this.state.isTweening = true;
      this.tweenStartTime = performance.now();
      this.fromStep = fromObjects;
      this.toStep = JSON.parse(JSON.stringify(this.state.steps[index].objects));
      this.state.currentStepIndex = index;
      this.animateTween();
    }
  }

  isPlaying() {
    return this.playing;
  }

  isTweening() {
    return this.tweening;
  }
}
