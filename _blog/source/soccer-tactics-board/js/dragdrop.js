export class DragDrop {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.state = state;
    this.dragging = false;
    this.draggedObject = null;
    this.offsetX = 0;
    this.offsetY = 0;

    this.selecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;

    this.groupDragging = false;
    this.groupOffsets = [];

    this.draggedComment = null;
    this.commentDragging = false;
    this.commentOffsetX = 0;
    this.commentOffsetY = 0;

    // ダブルタッチ検出用
    this.lastTapTime = 0;
    this.lastTapObject = null;
    this.doubleTapDelay = 300; // ミリ秒

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.canvas.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
    this.canvas.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.canvas.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));

    this.canvas.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  onDoubleClick(e) {
    const { x, y } = this.canvas.getCanvasCoordinates(e.clientX, e.clientY);

    const commentInfo = this.canvas.getCommentAt(x, y);
    if (commentInfo) {
      const text = prompt('吹き出しのテキストを編集してください:', commentInfo.comment.text || '');
      if (text !== null) {
        this.state.updateComment(commentInfo.comment.id, text);
      }
      return;
    }

    // 選手のダブルクリック検出
    const obj = this.canvas.getObjectAt(x, y);
    if (obj && obj.type === 'player') {
      // ダブルクリックイベントをトリガー
      if (this.doubleClickCallback) {
        this.doubleClickCallback(obj);
      }
    }
  }

  setDoubleClickCallback(callback) {
    this.doubleClickCallback = callback;
  }

  onMouseDown(e) {
    if (this.state.isTweening) return;

    const { x, y } = this.canvas.getCanvasCoordinates(e.clientX, e.clientY);

    const commentInfo = this.canvas.getCommentAt(x, y);
    if (commentInfo) {
      this.commentDragging = true;
      this.draggedComment = commentInfo.comment;
      this.commentOffsetX = x - commentInfo.comment.position.x;
      this.commentOffsetY = y - commentInfo.comment.position.y;
      this.state.selectObject(commentInfo.comment.id);
      return;
    }

    const obj = this.canvas.getObjectAt(x, y);

    if (obj) {
      if (this.state.selectedObjects.some(o => o.id === obj.id)) {
        this.groupDragging = true;
        this.groupOffsets = this.state.selectedObjects.map(o => ({
          id: o.id,
          offsetX: x - o.x,
          offsetY: y - o.y
        }));
      } else {
        this.dragging = true;
        this.draggedObject = obj;
        this.offsetX = x - obj.x;
        this.offsetY = y - obj.y;
        this.state.selectObject(obj.id);
      }
    } else {
      this.selecting = true;
      this.selectionStart = { x, y };
      this.selectionEnd = { x, y };
      this.state.deselectObject();
    }
  }

  onMouseMove(e) {
    const { x, y } = this.canvas.getCanvasCoordinates(e.clientX, e.clientY);

    if (this.commentDragging && this.draggedComment) {
      const newX = Math.max(0, Math.min(this.canvas.width - 100, x - this.commentOffsetX));
      const newY = Math.max(0, Math.min(this.canvas.height - 100, y - this.commentOffsetY));
      this.state.updateCommentPosition(this.draggedComment.id, newX, newY);
      this.canvas.canvas.style.cursor = 'move';
    } else if (this.selecting) {
      this.selectionEnd = { x, y };
      this.state.notifyListeners();
    } else if (this.groupDragging) {
      const deltas = this.groupOffsets.map(({ id, offsetX, offsetY }) => {
        const obj = this.state.objects.find(o => o.id === id);
        if (!obj) return null;

        const newX = Math.max(obj.radius, Math.min(this.canvas.width - obj.radius, x - offsetX));
        const newY = Math.max(obj.radius, Math.min(this.canvas.height - obj.radius, y - offsetY));

        return {
          id,
          dx: newX - obj.x,
          dy: newY - obj.y
        };
      }).filter(Boolean);

      this.state.updateMultipleObjectPositions(deltas);
    } else if (this.dragging && this.draggedObject) {
      const newX = Math.max(this.draggedObject.radius, Math.min(this.canvas.width - this.draggedObject.radius, x - this.offsetX));
      const newY = Math.max(this.draggedObject.radius, Math.min(this.canvas.height - this.draggedObject.radius, y - this.offsetY));

      this.state.updateObjectPosition(this.draggedObject.id, newX, newY);
    } else {
      const commentInfo = this.canvas.getCommentAt(x, y);
      if (commentInfo) {
        this.canvas.canvas.style.cursor = 'move';
      } else {
        this.canvas.canvas.style.cursor = 'crosshair';
      }
    }
  }

  onMouseUp(e) {
    if (this.selecting) {
      this.finishSelection();
    }

    this.dragging = false;
    this.draggedObject = null;
    this.selecting = false;
    this.commentDragging = false;
    this.draggedComment = null;

    const { x, y } = this.canvas.getCanvasCoordinates(e.clientX, e.clientY);
    const commentInfo = this.canvas.getCommentAt(x, y);
    if (commentInfo) {
      this.canvas.canvas.style.cursor = 'move';
    } else {
      this.canvas.canvas.style.cursor = 'crosshair';
    }
    this.selectionStart = null;
    this.selectionEnd = null;
    this.groupDragging = false;
    this.groupOffsets = [];
  }

  finishSelection() {
    if (!this.selectionStart || !this.selectionEnd) return;

    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);

    const selectedIds = this.state.objects
      .filter(obj => obj.x >= minX && obj.x <= maxX && obj.y >= minY && obj.y <= maxY)
      .map(obj => obj.id);

    if (selectedIds.length > 0) {
      this.state.selectMultipleObjects(selectedIds);
    }
  }

  getSelectionRect() {
    if (!this.selecting || !this.selectionStart || !this.selectionEnd) {
      return null;
    }

    return {
      x: Math.min(this.selectionStart.x, this.selectionEnd.x),
      y: Math.min(this.selectionStart.y, this.selectionEnd.y),
      width: Math.abs(this.selectionEnd.x - this.selectionStart.x),
      height: Math.abs(this.selectionEnd.y - this.selectionStart.y)
    };
  }

  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y } = this.canvas.getCanvasCoordinates(touch.clientX, touch.clientY);

      const commentInfo = this.canvas.getCommentAt(x, y);
      if (commentInfo) {
        // ダブルタッチ検出（吹き出し用）
        const currentTime = Date.now();
        if (this.lastTapTime && this.lastTapObject === commentInfo.comment.id &&
            (currentTime - this.lastTapTime) < this.doubleTapDelay) {
          // ダブルタップで吹き出し編集
          const text = prompt('吹き出しのテキストを編集してください:', commentInfo.comment.text || '');
          if (text !== null) {
            this.state.updateComment(commentInfo.comment.id, text);
          }
          this.lastTapTime = 0;
          this.lastTapObject = null;
          return;
        }
        this.lastTapTime = currentTime;
        this.lastTapObject = commentInfo.comment.id;

        this.commentDragging = true;
        this.draggedComment = commentInfo.comment;
        this.commentOffsetX = x - commentInfo.comment.position.x;
        this.commentOffsetY = y - commentInfo.comment.position.y;
        this.state.selectObject(commentInfo.comment.id);
        return;
      }

      const obj = this.canvas.getObjectAt(x, y);

      if (obj) {
        // ダブルタッチ検出（選手用）
        const currentTime = Date.now();
        if (obj.type === 'player' && this.lastTapTime && this.lastTapObject === obj.id &&
            (currentTime - this.lastTapTime) < this.doubleTapDelay) {
          // ダブルタップで回転コントロール表示
          if (this.doubleClickCallback) {
            this.doubleClickCallback(obj);
          }
          this.lastTapTime = 0;
          this.lastTapObject = null;
          return;
        }
        this.lastTapTime = currentTime;
        this.lastTapObject = obj.id;

        if (this.state.selectedObjects.some(o => o.id === obj.id)) {
          this.groupDragging = true;
          this.groupOffsets = this.state.selectedObjects.map(o => ({
            id: o.id,
            offsetX: x - o.x,
            offsetY: y - o.y
          }));
        } else {
          this.dragging = true;
          this.draggedObject = obj;
          this.offsetX = x - obj.x;
          this.offsetY = y - obj.y;
          this.state.selectObject(obj.id);
        }
      } else {
        this.state.deselectObject();
      }
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const { x, y } = this.canvas.getCanvasCoordinates(touch.clientX, touch.clientY);

    if (this.commentDragging && this.draggedComment) {
      const newX = Math.max(0, Math.min(this.canvas.width - 100, x - this.commentOffsetX));
      const newY = Math.max(0, Math.min(this.canvas.height - 100, y - this.commentOffsetY));
      this.state.updateCommentPosition(this.draggedComment.id, newX, newY);
    } else if (this.groupDragging) {
      const deltas = this.groupOffsets.map(({ id, offsetX, offsetY }) => {
        const obj = this.state.objects.find(o => o.id === id);
        if (!obj) return null;

        const newX = Math.max(obj.radius, Math.min(this.canvas.width - obj.radius, x - offsetX));
        const newY = Math.max(obj.radius, Math.min(this.canvas.height - obj.radius, y - offsetY));

        return {
          id,
          dx: newX - obj.x,
          dy: newY - obj.y
        };
      }).filter(Boolean);

      this.state.updateMultipleObjectPositions(deltas);
    } else if (this.dragging && this.draggedObject) {
      const newX = Math.max(this.draggedObject.radius, Math.min(this.canvas.width - this.draggedObject.radius, x - this.offsetX));
      const newY = Math.max(this.draggedObject.radius, Math.min(this.canvas.height - this.draggedObject.radius, y - this.offsetY));

      this.state.updateObjectPosition(this.draggedObject.id, newX, newY);
    }
  }

  onTouchEnd() {
    this.dragging = false;
    this.draggedObject = null;
    this.groupDragging = false;
    this.groupOffsets = [];
    this.commentDragging = false;
    this.draggedComment = null;
  }

  onContextMenu(e) {
    e.preventDefault();
    const { x, y } = this.canvas.getCanvasCoordinates(e.clientX, e.clientY);
    const obj = this.canvas.getObjectAt(x, y);

    if (obj && obj.type === 'player') {
      if (this.state.selectedObjects.some(o => o.id === obj.id)) {
        this.state.selectedObjects.forEach(o => {
          if (o.type === 'player') {
            this.state.rotateObject(o.id, 45);
          }
        });
      } else {
        this.state.rotateObject(obj.id, 45);
      }
    }
  }

  onWheel(e) {
    const { x, y } = this.canvas.getCanvasCoordinates(e.clientX, e.clientY);
    const obj = this.canvas.getObjectAt(x, y);

    if (obj && obj.type === 'player') {
      e.preventDefault();
      const angle = e.deltaY > 0 ? 15 : -15;

      if (this.state.selectedObjects.some(o => o.id === obj.id)) {
        this.state.selectedObjects.forEach(o => {
          if (o.type === 'player') {
            this.state.rotateObject(o.id, angle);
          }
        });
      } else {
        this.state.rotateObject(obj.id, angle);
      }
    }
  }
}
