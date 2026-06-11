import { State } from './state.js';
import { Canvas } from './canvas.js';
import { DragDrop } from './dragdrop.js';
import { Animation } from './animation.js';
import { Storage } from './storage.js';
import { PresetManager } from './presets.js';
import { AnimationManager } from './animationManager.js';
import { GifRecorder } from './gifRecorder.js';

class App {
  constructor() {
    try {
      this.state = new State();
      this.canvas = new Canvas(document.getElementById('field'), this.state);
      this.dragDrop = new DragDrop(this.canvas, this.state);
      this.canvas.setDragDrop(this.dragDrop);
      this.animation = new Animation(this.state, this.canvas);
      this.storage = new Storage(this.state);
      this.animationManager = new AnimationManager(this.state);
      this.presetManager = new PresetManager();
      this.gifRecorder = new GifRecorder(this.state, this.canvas, this.animation);
      this.rotationControlEnabled = false;
      this.ballImage = new Image();
      this.ballImage.src = 'favicon.ico';
      this.ballImage.onload = () => {
        this.drawButtonIcons();
        this.canvas.setBallImage(this.ballImage);
        this.canvas.draw();
      };
      this.setupEventListeners();
      this.setupMenuListeners();
      this.setupRotationControl();
      this.setupDoubleClickHandler();
      this.state.addListener(() => this.onStateChange());
      this.storage.loadFromLocalStorage();
      this.updateStepControls();
      this.updateDeleteButtonVisibility();
      this.renderSavedAnimations();
      this.initializePresets();
    } catch (error) {
      console.error('App初期化エラー:', error);
      alert(`初期化エラー: ${error.message}\nLocalStorageをクリアしてページを再読み込みしてください。`);
    }
  }

  drawButtonIcons() {
    // 赤選手アイコン
    const redPlayerCanvas = document.querySelector('#addRedPlayer .btn-canvas');
    const redPlayerCtx = redPlayerCanvas.getContext('2d');
    this.drawPlayerIcon(redPlayerCtx, 28, 28, '#e74c3c', 12);

    // 青選手アイコン
    const bluePlayerCanvas = document.querySelector('#addBluePlayer .btn-canvas');
    const bluePlayerCtx = bluePlayerCanvas.getContext('2d');
    this.drawPlayerIcon(bluePlayerCtx, 28, 28, '#3498db', 12);

    // ボールアイコン
    const ballCanvas = document.querySelector('#addBall .btn-canvas');
    const ballCtx = ballCanvas.getContext('2d');
    this.drawBallIcon(ballCtx, 28, 28, 13);

    // マーカーアイコン
    const markerCanvas = document.querySelector('#addMarker .btn-canvas');
    const markerCtx = markerCanvas.getContext('2d');
    this.drawMarkerIcon(markerCtx, 28, 28, 13);
  }

  drawPlayerIcon(ctx, x, y, color, radius) {
    // 円を描画
    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 方向を示す三角形
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    const triangleSize = 6;
    const offset = radius + 2;
    ctx.beginPath();
    ctx.moveTo(0, -offset - triangleSize);
    ctx.lineTo(-triangleSize * 0.6, -offset);
    ctx.lineTo(triangleSize * 0.6, -offset);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawBallIcon(ctx, x, y, radius) {
    if (this.ballImage && this.ballImage.complete) {
      const size = radius * 2;
      ctx.drawImage(this.ballImage, x - radius, y - radius, size, size);
    } else {
      // 画像が読み込まれていない場合のフォールバック
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  drawMarkerIcon(ctx, x, y, radius) {
    ctx.fillStyle = '#9b59b6';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  async initializePresets() {
    try {
      await this.presetManager.loadPresets();
      this.renderPresets();
    } catch (error) {
      console.error('プリセット初期化エラー:', error);
      const presetList = document.querySelector('.preset-list');
      if (presetList) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'プリセットの読み込みに失敗しました';
        presetList.replaceChildren(emptyMsg);
      }
    }
  }

  renderPresets() {
    const presetList = document.querySelector('.preset-list');
    const presets = this.presetManager.getPresets();

    if (!presetList) return;

    if (presets.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      emptyMsg.textContent = 'presets not found';
      presetList.replaceChildren(emptyMsg);
      return;
    }

    presetList.replaceChildren();
    presets.forEach(preset => {
      const item = document.createElement('div');
      item.className = 'preset-item';
      item.dataset.preset = preset.id;

      const info = document.createElement('div');
      info.className = 'preset-info';

      const title = document.createElement('div');
      title.className = 'preset-title';
      title.textContent = preset.title;

      const description = document.createElement('div');
      description.className = 'preset-description';

      info.appendChild(title);
      info.appendChild(description);
      item.appendChild(info);
      presetList.appendChild(item);
    });

    this.setupPresetListeners();
  }

  setupPresetListeners() {
    document.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', () => {
        this.loadPreset(item.dataset.preset);
        this.closeMenu();
      });
    });
  }

  closeMenu() {
    document.getElementById('menuOverlay').classList.remove('active');
    document.getElementById('sideMenu').classList.remove('active');
  }

  setupEventListeners() {
    document.getElementById('addRedPlayer').addEventListener('click', () => {
      this.state.addObject('player', 'red', 170, 451);
    });

    document.getElementById('addBluePlayer').addEventListener('click', () => {
      this.state.addObject('player', 'blue', 170, 111);
    });

    document.getElementById('addBall').addEventListener('click', () => {
      this.state.addObject('ball', 'orange', 170, 281);
    });

    document.getElementById('addMarker').addEventListener('click', () => {
      this.state.addObject('marker', 'purple', 170, 281);
    });

    document.getElementById('addComment').addEventListener('click', () => {
      const text = prompt('Enter comment text:');
      if (text !== null && text.trim() !== '') {
        this.state.addComment(text, 20, 40, 170, 281);
        this.canvas.draw();
      }
    });

    document.getElementById('deleteSelected').addEventListener('click', () => {
      if (this.state.selectedObjects && this.state.selectedObjects.length > 0) {
        this.state.selectedObjects.forEach(obj => {
          this.state.removeObject(obj.id);
        });
      }
    });

    document.getElementById('saveStep').addEventListener('click', () => {
      this.state.saveStep();
      this.updateStepControls();
    });

    document.getElementById('updateStep').addEventListener('click', () => {
      if (this.state.isTweening) {
        this.showNotification('Cannot update while animation is playing', 'error');
        return;
      }

      if (this.state.steps.length > 0) {
        this.state.updateStep(this.state.currentStepIndex);
        this.state.loadStep(this.state.currentStepIndex);
        this.updateStepControls();
        this.canvas.draw();
        this.showNotification(`Updated step ${this.state.currentStepIndex + 1}`, 'success');
      } else {
        this.showNotification('No steps to update', 'error');
      }
    });

    document.getElementById('deleteStep').addEventListener('click', () => {
      if (this.state.steps.length > 0) {
        const stepNum = this.state.currentStepIndex + 1;
        this.state.deleteStep(this.state.currentStepIndex);
        this.updateStepControls();
        this.showNotification(`Deleted step ${stepNum}`, 'success');
      } else {
        this.showNotification('No steps to delete', 'error');
      }
    });

    document.getElementById('playPause').addEventListener('click', () => {
      const isPlaying = this.animation.toggle();
      document.getElementById('playPause').textContent = isPlaying ? '⏸' : '▶';
    });

    let timer;
    const delay = 500; // 500ms (milliseconds)
    document.getElementById('stepSlider').addEventListener('input', (e) => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        this.animation.goToStep(parseInt(e.target.value));
        document.getElementById('playPause').textContent = '▶';
      }, delay);


    });

    document.getElementById('exportJson').addEventListener('click', () => {
      const title = prompt('Enter title:', 'Soccer Tactics Board');
      if (title === null) return;

      try {
        this.storage.exportToJson(title.trim() || 'Soccer Tactics Board');
        this.showNotification('Downloaded JSON file', 'success');
      } catch (error) {
        console.error('Export error:', error);
        this.showNotification(`Export failed: ${error.message}`, 'error');
      }
    });

    document.getElementById('importJson').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await this.storage.importFromJson(file);
          this.updateStepControls();
          this.showNotification('Loaded JSON file', 'success');
        } catch (error) {
          console.error('Import error:', error);
          this.showNotification(`Import failed: ${error.message}`, 'error');
        }
        e.target.value = '';
      }
    });

    document.getElementById('exportGif').addEventListener('click', async () => {
      if (this.gifRecorder.isRecording()) {
        this.showNotification('Generating GIF...', 'info');
        return;
      }

      if (this.animation.isPlaying()) {
        this.animation.stop();
        document.getElementById('playPause').textContent = '\u25B6';
      }

      const overlay = document.getElementById('exportOverlay');
      const allButtons = document.querySelectorAll('button, .btn-file-label');
      try {
        overlay.classList.add('active');
        allButtons.forEach(btn => {
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
        });

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await this.gifRecorder.record();

        this.showNotification('Downloaded GIF', 'success');
      } catch (error) {
        console.error('GIF export error:', error);
        this.showNotification(error.message, 'error');
      } finally {
        overlay.classList.remove('active');
        allButtons.forEach(btn => {
          btn.disabled = false;
          btn.style.pointerEvents = '';
        });
      }
    });

    document.getElementById('clearAll').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.removeItem('soccer-tactics-board');
        this.state.reset();
        this.showNotification('Cleared all data', 'success');
      }
    });
  }

  setupMenuListeners() {
    const menuButton = document.getElementById('menuButton');
    const menuOverlay = document.getElementById('menuOverlay');
    const sideMenu = document.getElementById('sideMenu');
    const closeSideMenu = document.getElementById('closeSideMenu');

    const openMenu = () => {
      menuOverlay.classList.add('active');
      sideMenu.classList.add('active');
    };

    const closeMenu = () => {
      menuOverlay.classList.remove('active');
      sideMenu.classList.remove('active');
    };

    menuButton.addEventListener('click', openMenu);
    closeSideMenu.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    document.getElementById('saveAnimation').addEventListener('click', () => {
      const name = prompt('Enter animation name:');
      if (name === null) return;

      try {
        const result = this.animationManager.saveAnimation(name);

        if (result.exists) {
          if (confirm(`"${name}" already exists. Overwrite?`)) {
            this.animationManager.updateAnimation(result.id, name);
            this.showNotification(`Overwrote "${name}"`, 'success');
            this.renderSavedAnimations();
          }
        } else {
          this.showNotification(`Saved "${name}"`, 'success');
          this.renderSavedAnimations();
        }
      } catch (error) {
        this.showNotification(error.message, 'error');
      }
    });
  }

  loadPreset(presetId) {
    const presetData = this.presetManager.getPreset(presetId);
    if (!presetData) {
      this.showNotification('No presets found', 'error');
      return;
    }

    const preset = presetData.data;

    this.state.reset();
    this.state.steps = JSON.parse(JSON.stringify(preset.steps));
    this.state.currentStepIndex = 0;
    this.state.nextPlayerId = { red: 10, blue: 10 };

    if (this.state.steps.length > 0) {
      this.state.objects = JSON.parse(JSON.stringify(this.state.steps[0].objects));
      this.state.comments = JSON.parse(JSON.stringify(this.state.steps[0].comments || []));
    }

    this.state.notifyListeners();
    this.updateStepControls();
    this.renderSavedAnimations();
    this.showNotification(`Loaded ${presetData.title}`, 'success');
  }

  renderSavedAnimations() {
    const listContainer = document.getElementById('savedAnimationsList');
    const animations = this.animationManager.getSavedAnimations();

    listContainer.replaceChildren();

    if (animations.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      listContainer.appendChild(emptyMsg);
      return;
    }

    animations.forEach((anim, index) => {
      const item = document.createElement('div');
      item.className = 'saved-animation-item';
      if (anim.id === this.state.currentLoadedAnimationId) {
        item.classList.add('active');
      }
      item.draggable = true;
      item.dataset.id = anim.id;
      item.dataset.index = index;

      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle';
      dragHandle.textContent = '☰';

      const info = document.createElement('div');
      info.className = 'saved-animation-info';

      const name = document.createElement('div');
      name.className = 'saved-animation-name';
      name.textContent = anim.name;

      info.appendChild(name);

      const actions = document.createElement('div');
      actions.className = 'saved-animation-actions';

      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn btn-sm btn-ghost load-animation-btn';
      loadBtn.innerHTML = '<i class="fa-solid fa-file-import"></i>';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-delete-selected delete-animation-btn';
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

      actions.appendChild(loadBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(dragHandle);
      item.appendChild(info);
      item.appendChild(actions);

      listContainer.appendChild(item);
    });

    this.setupDragAndDrop();
    this.setupAnimationActions();
  }

  setupDragAndDrop() {
    const items = document.querySelectorAll('.saved-animation-item');
    let draggedItem = null;
    let draggedIndex = null;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        draggedIndex = parseInt(item.dataset.index);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
        draggedIndex = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(item.parentElement, e.clientY);
        if (afterElement == null) {
          item.parentElement.appendChild(draggedItem);
        } else {
          item.parentElement.insertBefore(draggedItem, afterElement);
        }
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropIndex = parseInt(item.dataset.index);
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
          this.animationManager.reorderAnimations(draggedIndex, dropIndex);
          this.renderSavedAnimations();
        }
      });
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.saved-animation-item:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  setupAnimationActions() {
    document.querySelectorAll('.load-animation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.saved-animation-item');
        const animId = item.dataset.id;
        try {
          const animation = this.animationManager.loadAnimation(animId);
          this.updateStepControls();
          this.renderSavedAnimations();
          this.showNotification(`Loaded "${animation.name}"`, 'success');
          document.getElementById('menuOverlay').classList.remove('active');
          document.getElementById('sideMenu').classList.remove('active');
        } catch (error) {
          this.showNotification(error.message, 'error');
        }
      });
    });

    document.querySelectorAll('.delete-animation-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.saved-animation-item');
        const animId = item.dataset.id;
        const animName = item.querySelector('.saved-animation-name').textContent;

        if (confirm(`Delete "${animName}"?`)) {
          try {
            this.animationManager.deleteAnimation(animId);
            this.renderSavedAnimations();
            this.showNotification('Deleted', 'success');
          } catch (error) {
            this.showNotification(error.message, 'error');
          }
        }
      });
    });
  }

  onStateChange() {
    this.canvas.draw();
    this.updateStepControls();
    this.updateDeleteButtonVisibility();

    const selectedPlayer = this.getSelectedPlayer();
    if (selectedPlayer && this.rotationControlEnabled) {
      this.showRotationControl(selectedPlayer);
    } else {
      this.hideRotationControl();
      this.rotationControlEnabled = false;
    }

    if (this.animation.isPlaying() && !this.state.isTweening) {
      if (this.state.currentStepIndex >= this.state.steps.length - 1) {
        this.animation.stop();
        document.getElementById('playPause').textContent = '▶';
      }
    }
  }

  updateDeleteButtonVisibility() {
    const deleteBtn = document.getElementById('deleteSelected');
    const hasSelection = this.state.selectedObjects && this.state.selectedObjects.length > 0;
    deleteBtn.style.display = hasSelection ? 'block' : 'none';
  }

  updateStepControls() {
    const stepCount = this.state.steps.length;
    const currentIndex = this.state.currentStepIndex;

    const slider = document.getElementById('stepSlider');
    slider.max = Math.max(0, stepCount - 1);
    slider.value = stepCount > 0 ? currentIndex : 0;

    const stepInfo = document.getElementById('stepInfo');
    stepInfo.textContent = `${stepCount > 0 ? currentIndex + 1 : 0}/${stepCount}`;

    document.getElementById('playPause').disabled = stepCount === 0;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  setupRotationControl() {
    this.rotationControl = document.getElementById('rotationControl');
    this.rotationSlider = document.getElementById('rotationSlider');
    this.rotationAngleValue = document.getElementById('rotationAngleValue');
    this.rotationPreviewCanvas = document.getElementById('rotationPreviewCanvas');
    this.rotationPreviewCtx = this.rotationPreviewCanvas.getContext('2d');
    this.closeRotationControl = document.getElementById('closeRotationControl');
    this.playerNameInput = document.getElementById('playerNameInput');

    this.rotationSlider.addEventListener('input', (e) => {
      const angle = parseInt(e.target.value);
      this.updateRotation(angle);
    });

    this.playerNameInput.addEventListener('input', (e) => {
      const name = e.target.value;
      this.updatePlayerName(name);
    });

    this.closeRotationControl.addEventListener('click', () => {
      this.hideRotationControl();
      this.rotationControlEnabled = false;
    });
  }

  setupDoubleClickHandler() {
    this.dragDrop.setDoubleClickCallback((player) => {
      this.state.selectObject(player.id);
      this.rotationControlEnabled = true;
      this.showRotationControl(player);
    });
  }

  updateRotation(angle) {
    const selectedPlayer = this.getSelectedPlayer();
    if (selectedPlayer) {
      this.state.setObjectDirection(selectedPlayer.id, angle);
      this.rotationAngleValue.textContent = angle;
      this.drawRotationPreview(selectedPlayer.color, angle);
    }
  }

  updatePlayerName(name) {
    const selectedPlayer = this.getSelectedPlayer();
    if (selectedPlayer) {
      this.state.updatePlayerName(selectedPlayer.id, name);
    }
  }

  getSelectedPlayer() {
    if (this.state.selectedObjects.length === 1) {
      const obj = this.state.selectedObjects[0];
      if (obj.type === 'player') {
        return obj;
      }
    }
    return null;
  }

  showRotationControl(player) {
    const angle = player.direction || 0;
    this.rotationSlider.value = angle;
    this.rotationAngleValue.textContent = angle;
    this.playerNameInput.value = player.name || '';
    this.drawRotationPreview(player.color, angle);
    this.rotationControl.classList.add('visible');
  }

  hideRotationControl() {
    this.rotationControl.classList.remove('visible');
  }

  drawRotationPreview(color, angle) {
    const canvas = this.rotationPreviewCanvas;
    const ctx = this.rotationPreviewCtx;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colorCode = color === 'red' ? '#e74c3c' : '#3498db';
    const radius = 18;

    ctx.fillStyle = colorCode;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle * Math.PI / 180);

    ctx.fillStyle = colorCode;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    const triangleSize = 10;
    const offset = radius + 4;

    ctx.beginPath();
    ctx.moveTo(0, -offset - triangleSize);
    ctx.lineTo(-triangleSize * 0.6, -offset);
    ctx.lineTo(triangleSize * 0.6, -offset);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});

function sleep(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}
