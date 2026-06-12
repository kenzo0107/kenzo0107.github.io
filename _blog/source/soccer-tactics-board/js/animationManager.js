export class AnimationManager {
  constructor(state) {
    this.state = state;
    this.savedAnimations = this.loadSavedAnimations();
  }

  loadSavedAnimations() {
    try {
      const saved = localStorage.getItem('soccer-tactics-saved-animations');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('保存済みアニメーションの読み込みエラー:', error);
      return [];
    }
  }

  saveSavedAnimations() {
    try {
      localStorage.setItem('soccer-tactics-saved-animations', JSON.stringify(this.savedAnimations));
    } catch (error) {
      console.error('保存済みアニメーションの保存エラー:', error);
    }
  }

  findAnimationByName(name) {
    return this.savedAnimations.find(a => a.name === name.trim());
  }

  saveAnimation(name) {
    if (!name || name.trim() === '') {
      throw new Error('アニメーション名を入力してください');
    }

    if (this.state.steps.length === 0) {
      throw new Error('保存するステップがありません');
    }

    const existingAnimation = this.findAnimationByName(name);
    if (existingAnimation) {
      return { exists: true, id: existingAnimation.id, name: existingAnimation.name };
    }

    const animation = {
      id: Date.now().toString(),
      name: name.trim(),
      timestamp: Date.now(),
      steps: JSON.parse(JSON.stringify(this.state.steps))
    };

    this.savedAnimations.unshift(animation);
    this.saveSavedAnimations();
    this.state.setCurrentLoadedAnimationId(animation.id);

    return { exists: false, animation };
  }

  updateAnimation(id, name) {
    const animation = this.savedAnimations.find(a => a.id === id);
    if (!animation) {
      throw new Error('アニメーションが見つかりません');
    }

    if (this.state.steps.length === 0) {
      throw new Error('保存するステップがありません');
    }

    animation.name = name.trim();
    animation.timestamp = Date.now();
    animation.steps = JSON.parse(JSON.stringify(this.state.steps));

    this.saveSavedAnimations();
    this.state.setCurrentLoadedAnimationId(animation.id);

    return animation;
  }

  loadAnimation(id) {
    const animation = this.savedAnimations.find(a => a.id === id);
    if (!animation) {
      throw new Error('アニメーションが見つかりません');
    }

    this.state.reset();
    this.state.steps = JSON.parse(JSON.stringify(animation.steps));
    this.state.currentStepIndex = 0;
    this.state.nextPlayerId = { red: 10, blue: 10 };

    if (this.state.steps.length > 0) {
      this.state.objects = JSON.parse(JSON.stringify(this.state.steps[0].objects));
      this.state.comments = JSON.parse(JSON.stringify(this.state.steps[0].comments || []));
      console.dir(this.state.comments);
    }

    this.state.setCurrentLoadedAnimationId(id);
    this.state.notifyListeners();

    return animation;
  }

  deleteAnimation(id) {
    const index = this.savedAnimations.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('アニメーションが見つかりません');
    }

    this.savedAnimations.splice(index, 1);
    this.saveSavedAnimations();
  }

  reorderAnimations(fromIndex, toIndex) {
    const [removed] = this.savedAnimations.splice(fromIndex, 1);
    this.savedAnimations.splice(toIndex, 0, removed);
    this.saveSavedAnimations();
  }

  getSavedAnimations() {
    return this.savedAnimations;
  }
}
