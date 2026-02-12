export class PresetManager {
  constructor() {
    this.presets = [];
  }

  async loadPresets() {
    try {
      const presetFiles = [
        '2vs1-1.json',
        '2vs1-2.json',
        'training-2vs1-1.json',
        '3vs2-1.json',
        '3vs2-2.json',
        '3vs2-3.json',
        '3vs2-4.json',
      ];

      this.presets = [];

      for (const file of presetFiles) {
        try {
          const response = await fetch(`presets/${file}`);
          if (response.ok) {
            const data = await response.json();
            this.presets.push({
              id: file.replace('.json', ''),
              title: data.title || file.replace('.json', ''),
              description: data.description || '',
              data: data
            });
          }
        } catch (error) {
          console.warn(`プリセット ${file} の読み込みに失敗しました:`, error);
        }
      }

      return this.presets;
    } catch (error) {
      console.error('プリセットの読み込みに失敗しました:', error);
      return [];
    }
  }

  getPresets() {
    return this.presets;
  }

  getPreset(id) {
    return this.presets.find(p => p.id === id);
  }
}
