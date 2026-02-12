export class State {
  constructor() {
    this.objects = [];
    this.steps = [];
    this.currentStepIndex = 0;
    this.selectedObject = null;
    this.selectedObjects = [];
    this.nextPlayerId = { red: 1, blue: 1 };
    this.listeners = [];
    this.isTweening = false;
    this.comments = [];
    this.currentLoadedAnimationId = null;
  }

  addObject(type, color, x, y) {
    let id, radius, number, direction, name;

    if (type === 'player') {
      number = this.nextPlayerId[color];
      this.nextPlayerId[color]++;
      id = `player-${color}-${number}`;
      radius = 16; // プレイヤーの半径
      direction = 0;
      name = ''; // 初期値は空文字
    } else if (type === 'ball') {
      id = `ball-${Date.now()}`;
      radius = 10;
    } else if (type === 'marker') {
      id = `marker-${Date.now()}`;
      radius = 8;
    }

    const obj = { id, type, color, x, y, radius, number, direction, name };
    this.objects.push(obj);
    this.notifyListeners();
    return obj;
  }

  removeObject(id) {
    this.objects = this.objects.filter(obj => obj.id !== id);
    this.comments = this.comments.filter(comment => comment.id !== id);
    if (this.selectedObject?.id === id) {
      this.selectedObject = null;
    }
    this.selectedObjects = this.selectedObjects.filter(obj => obj.id !== id);
    this.notifyListeners();
  }

  updateObjectPosition(id, x, y) {
    const obj = this.objects.find(o => o.id === id);
    if (obj) {
      obj.x = x;
      obj.y = y;
      this.notifyListeners();
    }
  }

  rotateObject(id, angle) {
    const obj = this.objects.find(o => o.id === id);
    if (obj && obj.type === 'player') {
      obj.direction = (obj.direction + angle) % 360;
      if (obj.direction < 0) obj.direction += 360;
      this.notifyListeners();
    }
  }

  setObjectDirection(id, direction) {
    const obj = this.objects.find(o => o.id === id);
    if (obj && obj.type === 'player') {
      obj.direction = ((direction % 360) + 360) % 360;
      this.notifyListeners();
    }
  }

  updatePlayerName(id, name) {
    const obj = this.objects.find(o => o.id === id);
    if (obj && obj.type === 'player') {
      obj.name = name;
      this.notifyListeners();
    }
  }

  addComment(text, x = 20, y = 40) {
    const id = `comment-${Date.now()}`;
    const comment = {
      id,
      text,
      position: { x, y }
    };
    this.comments.push(comment);
    this.notifyListeners();
    return comment;
  }

  updateComment(id, text) {
    const comment = this.comments.find(c => c.id === id);
    if (comment) {
      comment.text = text;
      this.notifyListeners();
    }
  }

  updateCommentPosition(id, x, y) {
    const comment = this.comments.find(c => c.id === id);
    if (comment) {
      comment.position = { x, y };
      this.notifyListeners();
    }
  }

  selectObject(id) {
    this.selectedObject = this.objects.find(obj => obj.id === id) ||
                           this.comments.find(comment => comment.id === id);
    this.selectedObjects = [this.selectedObject];
    this.notifyListeners();
  }

  selectMultipleObjects(ids) {
    this.selectedObjects = [
      ...this.objects.filter(obj => ids.includes(obj.id)),
      ...this.comments.filter(comment => ids.includes(comment.id))
    ];
    this.selectedObject = this.selectedObjects.length > 0 ? this.selectedObjects[0] : null;
    this.notifyListeners();
  }

  deselectObject() {
    this.selectedObject = null;
    this.selectedObjects = [];
    this.notifyListeners();
  }

  updateMultipleObjectPositions(deltas) {
    deltas.forEach(({ id, dx, dy }) => {
      const obj = this.objects.find(o => o.id === id);
      if (obj) {
        obj.x += dx;
        obj.y += dy;
      }
    });
    this.notifyListeners();
  }

  saveStep() {
    const step = {
      stepId: this.steps.length,
      timestamp: Date.now(),
      objects: JSON.parse(JSON.stringify(this.objects)),
      comments: JSON.parse(JSON.stringify(this.comments))
    };
    this.steps.push(step);
    this.currentStepIndex = this.steps.length - 1;
    this.notifyListeners();
  }

  updateStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.steps[index] = {
        stepId: this.steps[index].stepId,
        timestamp: Date.now(),
        objects: JSON.parse(JSON.stringify(this.objects)),
        comments: JSON.parse(JSON.stringify(this.comments))
      };
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.steps.splice(index, 1);

      if (this.steps.length === 0) {
        this.currentStepIndex = 0;
        this.objects = [];
      } else if (index <= this.currentStepIndex) {
        this.currentStepIndex = Math.max(0, this.currentStepIndex - 1);
      }

      if (this.steps.length > 0) {
        this.objects = JSON.parse(JSON.stringify(this.steps[this.currentStepIndex].objects));
      }

      this.notifyListeners();
      return true;
    }
    return false;
  }

  loadStep(index) {
    if (index >= 0 && index < this.steps.length) {
      if (this.steps.length > 0 && this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
        this.steps[this.currentStepIndex] = {
          stepId: this.steps[this.currentStepIndex].stepId,
          timestamp: this.steps[this.currentStepIndex].timestamp,
          objects: JSON.parse(JSON.stringify(this.objects)),
          comments: JSON.parse(JSON.stringify(this.comments))
        };
      }

      this.currentStepIndex = index;
      this.objects = JSON.parse(JSON.stringify(this.steps[index].objects));
      this.comments = JSON.parse(JSON.stringify(this.steps[index].comments || []));
      this.deselectObject();
      this.notifyListeners();
    }
  }

  clearSteps() {
    this.steps = [];
    this.currentStepIndex = 0;
    this.notifyListeners();
  }

  reset() {
    this.objects = [];
    this.steps = [];
    this.currentStepIndex = 0;
    this.selectedObject = null;
    this.selectedObjects = [];
    this.nextPlayerId = { red: 1, blue: 1 };
    this.isTweening = false;
    this.comments = [];
    this.currentLoadedAnimationId = null;
    this.notifyListeners();
  }

  setCurrentLoadedAnimationId(id) {
    this.currentLoadedAnimationId = id;
    this.notifyListeners();
  }

  getData(title = 'サッカー作戦盤') {
    return {
      version: '1.0.0',
      title,
      description: '',
      fieldDimensions: { width: 400, height: 600 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: this.steps
    };
  }

  loadData(data) {
    if (!data || !data.steps) {
      throw new Error('Invalid data format');
    }
    this.steps = data.steps;
    this.currentStepIndex = 0;
    if (this.steps.length > 0) {
      this.objects = JSON.parse(JSON.stringify(this.steps[0].objects));
      this.comments = JSON.parse(JSON.stringify(this.steps[0].comments || []));
    }
    this._updateNextPlayerIdFromSteps();
    this.notifyListeners();
  }

  _updateNextPlayerIdFromSteps() {
    const maxNumbers = { red: 0, blue: 0 };
    for (const step of this.steps) {
      for (const obj of step.objects) {
        if (obj.type === 'player' && obj.color in maxNumbers) {
          maxNumbers[obj.color] = Math.max(maxNumbers[obj.color], obj.number);
        }
      }
    }
    this.nextPlayerId = {
      red: maxNumbers.red + 1,
      blue: maxNumbers.blue + 1
    };
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}
