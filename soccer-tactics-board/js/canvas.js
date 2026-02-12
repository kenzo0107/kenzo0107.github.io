export class Canvas {
  static BASE_WIDTH = 320;
  static BASE_HEIGHT = 510;

  constructor(canvasElement, state) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.state = state;
    this.dragDrop = null;
    this.ballImage = null;
    this.scale = 1;

    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  resize() {
    const container = this.canvas.parentElement;
    const toolbarWidth = 60;
    const aspectRatio = Canvas.BASE_HEIGHT / Canvas.BASE_WIDTH;
    const availableWidth = container.clientWidth - toolbarWidth;
    const availableHeight = container.clientHeight;

    let w = availableWidth;
    let h = w * aspectRatio;

    if (h > availableHeight) {
      h = availableHeight;
      w = h / aspectRatio;
    }

    w = Math.floor(w);
    h = Math.floor(h);

    this.scale = w / Canvas.BASE_WIDTH;

    this.canvas.width = w;
    this.canvas.height = h;
    this.width = Canvas.BASE_WIDTH;
    this.height = Canvas.BASE_HEIGHT;

    this.draw();
  }

  setDragDrop(dragDrop) {
    this.dragDrop = dragDrop;
  }

  setBallImage(image) {
    this.ballImage = image;
  }

  draw() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.scale(this.scale, this.scale);
    this.drawField();
    this.drawObjects();
    this.drawComment();
    this.drawSelectionRect();
    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawField() {
    const ctx = this.ctx;

    // ゴールエリアも含めた全体背景
    ctx.fillStyle = '#1e7a46';
    ctx.fillRect(0, 0, this.width, this.height);

    // フィールド部分（緑）
    const fieldY = 16;
    const fieldHeight = 460;
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, fieldY, this.width, fieldHeight);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    ctx.strokeRect(0, fieldY, this.width, fieldHeight);

    const centerY = fieldY + fieldHeight / 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(this.width, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.width / 2, centerY, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.width / 2, centerY, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    const penaltyAreaWidth = 120;
    const penaltyAreaHeight = 48;
    const goalAreaWidth = 42;
    const goalAreaHeight = 18;

    ctx.strokeRect((this.width - penaltyAreaWidth) / 2, fieldY, penaltyAreaWidth, penaltyAreaHeight);
    ctx.strokeRect((this.width - penaltyAreaWidth) / 2, fieldY + fieldHeight - penaltyAreaHeight, penaltyAreaWidth, penaltyAreaHeight);

    ctx.strokeRect((this.width - goalAreaWidth) / 2, fieldY, goalAreaWidth, goalAreaHeight);
    ctx.strokeRect((this.width - goalAreaWidth) / 2, fieldY + fieldHeight - goalAreaHeight, goalAreaWidth, goalAreaHeight);

    ctx.beginPath();
    ctx.arc(this.width / 2, fieldY + penaltyAreaHeight, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.width / 2, fieldY + fieldHeight - penaltyAreaHeight, 5, 0, Math.PI * 2);
    ctx.fill();

    // ゴールを描画
    this.drawGoals();
  }

  drawGoals() {
    const ctx = this.ctx;
    const goalWidth = 32;
    const goalDepth = 14;
    const fieldY = 16;
    const fieldHeight = 460;

    // 上のゴール（フィールドの外側）
    const topGoalX = (this.width - goalWidth) / 2;
    const topGoalY = 2;

    // ゴール背景（ネット奥）
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fillRect(topGoalX, topGoalY, goalWidth, goalDepth);

    // ゴールポスト（白）
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(topGoalX, topGoalY, goalWidth, goalDepth);

    // ゴールライン（太い白線）
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(topGoalX, fieldY);
    ctx.lineTo(topGoalX + goalWidth, fieldY);
    ctx.stroke();

    // ネットのクロスハッチ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < goalWidth; i += 10) {
      ctx.beginPath();
      ctx.moveTo(topGoalX + i, topGoalY);
      ctx.lineTo(topGoalX + i, topGoalY + goalDepth);
      ctx.stroke();
    }
    for (let i = 0; i < goalDepth; i += 10) {
      ctx.beginPath();
      ctx.moveTo(topGoalX, topGoalY + i);
      ctx.lineTo(topGoalX + goalWidth, topGoalY + i);
      ctx.stroke();
    }

    // 下のゴール（フィールドの外側）
    const bottomGoalX = (this.width - goalWidth) / 2;
    const bottomGoalY = fieldY + fieldHeight;

    // ゴール背景（ネット奥）
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.fillRect(bottomGoalX, bottomGoalY, goalWidth, goalDepth);

    // ゴールポスト（白）
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bottomGoalX, bottomGoalY, goalWidth, goalDepth);

    // ゴールライン（太い白線）
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bottomGoalX, bottomGoalY);
    ctx.lineTo(bottomGoalX + goalWidth, bottomGoalY);
    ctx.stroke();

    // ネットのクロスハッチ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < goalWidth; i += 10) {
      ctx.beginPath();
      ctx.moveTo(bottomGoalX + i, bottomGoalY);
      ctx.lineTo(bottomGoalX + i, bottomGoalY + goalDepth);
      ctx.stroke();
    }
    for (let i = 0; i < goalDepth; i += 10) {
      ctx.beginPath();
      ctx.moveTo(bottomGoalX, bottomGoalY + i);
      ctx.lineTo(bottomGoalX + goalWidth, bottomGoalY + i);
      ctx.stroke();
    }

    // ゴールエリアを保存（判定用）
    this.goalAreas = {
      top: { x: topGoalX, y: topGoalY, width: goalWidth, height: goalDepth },
      bottom: { x: bottomGoalX, y: bottomGoalY, width: goalWidth, height: goalDepth }
    };
  }

  drawObjects() {
    const prevStep = !this.state.isTweening && this.state.currentStepIndex > 0 ?
      this.state.steps[this.state.currentStepIndex - 1] : null;

    // ボールを選手より手前に表示するため、ボールを最後に描画する
    const sorted = [...this.state.objects].sort((a, b) => {
      if (a.type === 'ball' && b.type !== 'ball') return 1;
      if (a.type !== 'ball' && b.type === 'ball') return -1;
      return 0;
    });

    sorted.forEach(obj => {
      if (prevStep) {
        const prevObj = prevStep.objects.find(o => o.id === obj.id);
        if (prevObj && (prevObj.x !== obj.x || prevObj.y !== obj.y)) {
          this.drawTrail(prevObj.x, prevObj.y, obj.x, obj.y, obj.color);
        }
      }

      this.drawObject(obj);
    });
  }

  drawTrail(x1, y1, x2, y2, color) {
    const ctx = this.ctx;
    ctx.strokeStyle = this.getColorCode(color);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
  }

  drawObject(obj) {
    const ctx = this.ctx;
    const isSelected = this.state.selectedObjects.some(o => o.id === obj.id);

    if (obj.type === 'ball') {
      this.drawBall(obj, isSelected);
    } else if (obj.type === 'player') {
      this.drawPlayer(obj, isSelected);
    } else {
      ctx.fillStyle = this.getColorCode(obj.color);
      ctx.strokeStyle = isSelected ? 'yellow' : 'white';
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  drawPlayer(obj, isSelected) {
    const ctx = this.ctx;

    ctx.fillStyle = this.getColorCode(obj.color);
    ctx.strokeStyle = isSelected ? 'yellow' : 'white';
    ctx.lineWidth = isSelected ? 3 : 2;

    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (obj.number) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.number.toString(), obj.x, obj.y);
    }

    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate((obj.direction || 0) * Math.PI / 180);

    ctx.fillStyle = this.getColorCode(obj.color);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    const triangleSize = 8;
    const offset = obj.radius + 3;

    ctx.beginPath();
    ctx.moveTo(0, -offset - triangleSize);
    ctx.lineTo(-triangleSize * 0.6, -offset);
    ctx.lineTo(triangleSize * 0.6, -offset);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // 選手名を表示
    if (obj.name && obj.name.trim() !== '') {
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const textY = obj.y + obj.radius + 10;

      // テキストの幅を測定して背景を描画
      const textMetrics = ctx.measureText(obj.name);
      const textWidth = textMetrics.width;
      const bgPadding = 6;
      const bgHeight = 24;

      // 半透明の黒背景を描画
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
      ctx.fillRect(
        obj.x - textWidth / 2 - bgPadding,
        textY ,
        textWidth + bgPadding * 2,
        bgHeight
      );

      // 白い文字で選手名を表示
      ctx.fillStyle = 'white';
      ctx.fillText(obj.name, obj.x, textY);
    }
  }

  drawBall(obj, isSelected) {
    const ctx = this.ctx;

    if (this.ballImage && this.ballImage.complete) {
      const size = obj.radius * 2;
      ctx.drawImage(this.ballImage, obj.x - obj.radius, obj.y - obj.radius, size, size);

      if (isSelected) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // 画像が読み込まれていない場合のフォールバック
      ctx.fillStyle = 'white';
      ctx.strokeStyle = isSelected ? 'yellow' : 'black';
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'black';
      const pentagonSize = obj.radius * 0.35;

      ctx.save();
      ctx.translate(obj.x, obj.y);

      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * 120) * Math.PI / 180);

        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const angle = (j * 72 - 90) * Math.PI / 180;
          const x = pentagonSize * Math.cos(angle);
          const y = pentagonSize * Math.sin(angle) - obj.radius * 0.3;
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }
  }

  getColorCode(color) {
    const colors = {
      red: '#e74c3c',
      blue: '#3498db',
      orange: '#f39c12',
      purple: '#9b59b6'
    };
    return colors[color] || color;
  }

  getCanvasCoordinates(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.scale,
      y: (clientY - rect.top) / this.scale
    };
  }

  getObjectAt(x, y) {
    for (let i = this.state.objects.length - 1; i >= 0; i--) {
      const obj = this.state.objects[i];
      const distance = Math.sqrt((x - obj.x) ** 2 + (y - obj.y) ** 2);
      if (distance <= obj.radius) {
        return obj;
      }
    }
    return null;
  }

  drawComment() {
    this.state.comments.forEach(comment => {
      this.drawSingleComment(comment);
    });
  }

  drawSingleComment(comment) {
    if (!comment.text || comment.text.trim() === '') {
      return;
    }

    const ctx = this.ctx;
    const text = comment.text;
    const padding = 12;
    const maxWidth = this.width - 40;
    const x = comment.position.x;
    const y = comment.position.y;

    const isSelected = this.state.selectedObjects.some(o => o.id === comment.id);

    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lines = this.wrapText(text, maxWidth - padding * 2);
    const lineHeight = 20;
    const textHeight = lines.length * lineHeight;
    const boxHeight = textHeight + padding * 2;
    const boxWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2 + 20);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.strokeStyle = isSelected ? '#f39c12' : '#3498db';
    ctx.lineWidth = isSelected ? 3 : 2;

    const radius = 8;
    this.drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    lines.forEach((line, index) => {
      ctx.fillText(line, x + padding, y + padding + index * lineHeight);
    });

    ctx.shadowBlur = 0;
  }

  getCommentBoxBounds(comment) {
    if (!comment || !comment.text || comment.text.trim() === '') {
      return null;
    }

    const ctx = this.ctx;
    const text = comment.text;
    const padding = 12;
    const maxWidth = this.width - 40;
    const x = comment.position.x;
    const y = comment.position.y;

    ctx.font = 'bold 14px sans-serif';
    const lines = this.wrapText(text, maxWidth - padding * 2);
    const lineHeight = 20;
    const textHeight = lines.length * lineHeight;
    const boxHeight = textHeight + padding * 2;
    const boxWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2 + 20);

    return { id: comment.id, x, y, width: boxWidth, height: boxHeight };
  }

  getCommentAt(px, py) {
    for (let i = this.state.comments.length - 1; i >= 0; i--) {
      const comment = this.state.comments[i];
      const bounds = this.getCommentBoxBounds(comment);
      if (bounds && px >= bounds.x && px <= bounds.x + bounds.width &&
          py >= bounds.y && py <= bounds.y + bounds.height) {
        return { comment };
      }
    }
    return null;
  }

  wrapText(text, maxWidth) {
    const ctx = this.ctx;
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine !== '') {
      lines.push(currentLine);
    }

    return lines;
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawSelectionRect() {
    if (!this.dragDrop) return;

    const rect = this.dragDrop.getSelectionRect();
    if (!rect) return;

    const ctx = this.ctx;
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';

    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.setLineDash([]);
  }
}
