export class Storage {
  constructor(state) {
    this.state = state;
    this.storageKey = 'soccer-tactics-board';
  }

  saveToLocalStorage() {
    const data = this.state.getData();
    const json = JSON.stringify(data);

    if (json.length > 5 * 1024 * 1024) {
      throw new Error('Data size is too large (5MB limit)');
    }

    localStorage.setItem(this.storageKey, json);
    return true;
  }

  loadFromLocalStorage() {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) {
        return false;
      }

      console.log('Loading data from LocalStorage...');
      const data = JSON.parse(json);
      this.state.loadData(data);
      console.log('Successfully loaded data from LocalStorage');
      return true;
    } catch (error) {
      console.error('Failed to load from LocalStorage:', error);
      console.warn('Clearing corrupted data');
      localStorage.removeItem(this.storageKey);
      return false;
    }
  }

  exportToJson(title) {
    const data = this.state.getData(title);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }

  importFromJson(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = e.target.result;
          const data = JSON.parse(json);

          if (!data.version || !data.steps) {
            throw new Error('Invalid file format');
          }

          this.state.loadData(data);
          resolve(true);
        } catch (error) {
          console.error('Failed to import JSON:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        console.error(error);
        reject(error);
      };

      reader.readAsText(file);
    });
  }
}
