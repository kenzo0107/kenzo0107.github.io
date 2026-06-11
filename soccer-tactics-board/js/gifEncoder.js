/**
 * GIF89a エンコーダ（ピュアJavaScript実装）
 * Canvas の ImageData からアニメーションGIFを生成する
 */
export class GifEncoder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.frames = [];
    this.delay = 100; // デフォルト: 100ms (10fps)
  }

  setDelay(ms) {
    this.delay = ms;
  }

  addFrame(imageData) {
    this.frames.push(imageData);
  }

  encode() {
    const bytes = [];

    // GIF Header
    this.writeString(bytes, 'GIF89a');

    // Logical Screen Descriptor
    this.writeLittleEndian(bytes, this.width, 2);
    this.writeLittleEndian(bytes, this.height, 2);
    // Global Color Table Flag=0, Color Resolution=7, Sort=0, Size=0
    bytes.push(0x70); // No global color table, 8-bit color resolution
    bytes.push(0x00); // Background color index
    bytes.push(0x00); // Pixel aspect ratio

    // Netscape Application Extension (ループ用)
    bytes.push(0x21); // Extension introducer
    bytes.push(0xFF); // Application extension
    bytes.push(0x0B); // Block size
    this.writeString(bytes, 'NETSCAPE2.0');
    bytes.push(0x03); // Sub-block size
    bytes.push(0x01); // Sub-block ID
    this.writeLittleEndian(bytes, 0, 2); // Loop count (0 = infinite)
    bytes.push(0x00); // Block terminator

    for (const imageData of this.frames) {
      this.writeFrame(bytes, imageData);
    }

    // GIF Trailer
    bytes.push(0x3B);

    return new Uint8Array(bytes);
  }

  writeFrame(bytes, imageData) {
    const pixels = imageData.data;
    const { palette, indexedPixels } = this.quantize(pixels);
    const colorTableSize = palette.length / 3;
    const colorTableSizeBits = Math.ceil(Math.log2(colorTableSize));

    // Graphic Control Extension
    bytes.push(0x21); // Extension introducer
    bytes.push(0xF9); // Graphic control label
    bytes.push(0x04); // Block size
    bytes.push(0x00); // Disposal method: none, no transparent color
    this.writeLittleEndian(bytes, Math.round(this.delay / 10), 2); // Delay (1/100 sec)
    bytes.push(0x00); // Transparent color index
    bytes.push(0x00); // Block terminator

    // Image Descriptor
    bytes.push(0x2C); // Image separator
    this.writeLittleEndian(bytes, 0, 2); // Left
    this.writeLittleEndian(bytes, 0, 2); // Top
    this.writeLittleEndian(bytes, this.width, 2);
    this.writeLittleEndian(bytes, this.height, 2);
    // Local Color Table Flag=1, Interlace=0, Sort=0, Size
    bytes.push(0x80 | (colorTableSizeBits - 1));

    // Local Color Table
    for (let i = 0; i < palette.length; i++) {
      bytes.push(palette[i]);
    }
    // パディング（2^n個になるように）
    const totalColors = 1 << colorTableSizeBits;
    for (let i = colorTableSize; i < totalColors; i++) {
      bytes.push(0);
      bytes.push(0);
      bytes.push(0);
    }

    // Image Data (LZW compressed)
    const minCodeSize = Math.max(2, colorTableSizeBits);
    bytes.push(minCodeSize);
    const compressed = this.lzwCompress(indexedPixels, minCodeSize);
    this.writeSubBlocks(bytes, compressed);
    bytes.push(0x00); // Block terminator
  }

  /**
   * メディアンカット法による色量子化
   * RGBA画素データを256色パレットに変換
   */
  quantize(pixels) {
    const colorCounts = new Map();
    const pixelCount = pixels.length / 4;

    // 色をサンプリング（全画素処理で精度を重視）
    for (let i = 0; i < pixels.length; i += 4) {
      // 上位5ビットで量子化して色数を削減
      const r = pixels[i] & 0xF8;
      const g = pixels[i + 1] & 0xF8;
      const b = pixels[i + 2] & 0xF8;
      const key = (r << 16) | (g << 8) | b;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }

    // 色をボックスに分割
    const colors = Array.from(colorCounts.entries()).map(([key, count]) => ({
      r: (key >> 16) & 0xFF,
      g: (key >> 8) & 0xFF,
      b: key & 0xFF,
      count
    }));

    const maxColors = 256;
    const palette = this.medianCut(colors, maxColors);

    // パレットをフラット配列に変換
    const paletteFlat = [];
    for (const color of palette) {
      paletteFlat.push(color.r, color.g, color.b);
    }

    // 各ピクセルをパレットインデックスに変換（キャッシュ付き）
    const indexedPixels = new Uint8Array(pixelCount);
    const cache = new Map();

    for (let i = 0; i < pixelCount; i++) {
      const offset = i * 4;
      const r = pixels[offset] & 0xF8;
      const g = pixels[offset + 1] & 0xF8;
      const b = pixels[offset + 2] & 0xF8;
      const key = (r << 16) | (g << 8) | b;

      if (cache.has(key)) {
        indexedPixels[i] = cache.get(key);
      } else {
        const idx = this.findClosestColor(r, g, b, palette);
        cache.set(key, idx);
        indexedPixels[i] = idx;
      }
    }

    return { palette: paletteFlat, indexedPixels };
  }

  medianCut(colors, maxColors) {
    if (colors.length === 0) {
      return [{ r: 0, g: 0, b: 0 }];
    }

    let boxes = [{ colors, count: colors.reduce((sum, c) => sum + c.count, 0) }];

    while (boxes.length < maxColors) {
      // 最も色数の多いボックスを選択
      let maxBox = null;
      let maxBoxIndex = -1;
      let maxRange = -1;

      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].colors.length <= 1) continue;
        const range = this.getColorRange(boxes[i].colors);
        if (range.maxRange > maxRange) {
          maxRange = range.maxRange;
          maxBox = boxes[i];
          maxBoxIndex = i;
        }
      }

      if (!maxBox) break;

      const range = this.getColorRange(maxBox.colors);
      const channel = range.channel;

      // チャンネルでソート
      maxBox.colors.sort((a, b) => a[channel] - b[channel]);

      // 中央で分割
      const mid = Math.floor(maxBox.colors.length / 2);
      const box1Colors = maxBox.colors.slice(0, mid);
      const box2Colors = maxBox.colors.slice(mid);

      boxes.splice(maxBoxIndex, 1, {
        colors: box1Colors,
        count: box1Colors.reduce((sum, c) => sum + c.count, 0)
      }, {
        colors: box2Colors,
        count: box2Colors.reduce((sum, c) => sum + c.count, 0)
      });
    }

    // 各ボックスの重み付き平均色を算出
    return boxes.map(box => {
      let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
      for (const c of box.colors) {
        totalR += c.r * c.count;
        totalG += c.g * c.count;
        totalB += c.b * c.count;
        totalCount += c.count;
      }
      return {
        r: Math.round(totalR / totalCount),
        g: Math.round(totalG / totalCount),
        b: Math.round(totalB / totalCount)
      };
    });
  }

  getColorRange(colors) {
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const c of colors) {
      if (c.r < minR) minR = c.r;
      if (c.r > maxR) maxR = c.r;
      if (c.g < minG) minG = c.g;
      if (c.g > maxG) maxG = c.g;
      if (c.b < minB) minB = c.b;
      if (c.b > maxB) maxB = c.b;
    }
    const rRange = maxR - minR;
    const gRange = maxG - minG;
    const bRange = maxB - minB;

    if (rRange >= gRange && rRange >= bRange) {
      return { channel: 'r', maxRange: rRange };
    } else if (gRange >= bRange) {
      return { channel: 'g', maxRange: gRange };
    } else {
      return { channel: 'b', maxRange: bRange };
    }
  }

  findClosestColor(r, g, b, palette) {
    let minDist = Infinity;
    let minIndex = 0;

    for (let i = 0; i < palette.length; i++) {
      const dr = r - palette[i].r;
      const dg = g - palette[i].g;
      const db = b - palette[i].b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
        if (dist === 0) break;
      }
    }

    return minIndex;
  }

  /**
   * LZW 圧縮
   */
  lzwCompress(indexedPixels, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxCodeSize = 12;
    const maxCode = 1 << maxCodeSize;

    // 出力ビットストリーム
    const output = [];
    let currentByte = 0;
    let currentBits = 0;

    const writeBits = (code, size) => {
      currentByte |= (code << currentBits);
      currentBits += size;
      while (currentBits >= 8) {
        output.push(currentByte & 0xFF);
        currentByte >>= 8;
        currentBits -= 8;
      }
    };

    // 辞書を初期化
    let dict = new Map();
    const initDict = () => {
      dict.clear();
      for (let i = 0; i < clearCode; i++) {
        dict.set(String(i), i);
      }
      nextCode = eoiCode + 1;
      codeSize = minCodeSize + 1;
    };

    // Clear code で開始
    writeBits(clearCode, codeSize);
    initDict();

    if (indexedPixels.length === 0) {
      writeBits(eoiCode, codeSize);
      if (currentBits > 0) {
        output.push(currentByte & 0xFF);
      }
      return output;
    }

    let current = String(indexedPixels[0]);

    for (let i = 1; i < indexedPixels.length; i++) {
      const next = String(indexedPixels[i]);
      const combined = current + ',' + next;

      if (dict.has(combined)) {
        current = combined;
      } else {
        writeBits(dict.get(current), codeSize);

        if (nextCode < maxCode) {
          dict.set(combined, nextCode);
          nextCode++;
          if (nextCode > (1 << codeSize) && codeSize < maxCodeSize) {
            codeSize++;
          }
        } else {
          // 辞書がいっぱいになったらリセット
          writeBits(clearCode, codeSize);
          initDict();
        }

        current = next;
      }
    }

    // 残りのデータを出力
    writeBits(dict.get(current), codeSize);
    writeBits(eoiCode, codeSize);

    if (currentBits > 0) {
      output.push(currentByte & 0xFF);
    }

    return output;
  }

  writeSubBlocks(bytes, data) {
    let offset = 0;
    while (offset < data.length) {
      const blockSize = Math.min(255, data.length - offset);
      bytes.push(blockSize);
      for (let i = 0; i < blockSize; i++) {
        bytes.push(data[offset + i]);
      }
      offset += blockSize;
    }
  }

  writeString(bytes, str) {
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
  }

  writeLittleEndian(bytes, value, numBytes) {
    for (let i = 0; i < numBytes; i++) {
      bytes.push(value & 0xFF);
      value >>= 8;
    }
  }
}
