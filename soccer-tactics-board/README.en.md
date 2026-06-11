<img src="tactics-2vs1-1.gif" width="200px">

# Soccer Tactics Board

A vertical-field soccer tactics board web application. You can freely place players and save movements step by step to create animations.

## Features

- **Player Placement**: Freely add and position players for the red and blue teams
- **Add Objects**: Place balls and markers
- **Add Speech Bubbles**: Add text bubbles with descriptions
- **Drag & Drop**: Move elements freely with mouse or touch
- **Animation**: Save step-by-step movements and play them back
- **Auto Play**: Automatically play through steps
- **Manual Controls**: Navigate using Previous/Next buttons or a slider
- **Presets**: Load predefined tactics patterns
- **Data Persistence**: Automatically saved to LocalStorage
- **Export / Import**: Save and load data in JSON format

## How to Use

### Basic Operations

1. Run `python3 -m http.server 8000`
2. Open `http://localhost:8000/index.html` in your browser
3. Use the toolbar buttons to add players and objects:
   - **+Red Player**: Add a red team player
   - **+Blue Player**: Add a blue team player
   - **+Ball**: Add a ball
   - **+Marker**: Add a marker
4. Drag players and objects to position them
5. Click **Delete** to remove the selected object

### Creating Animations

1. Place players and click **Save Step**
2. Move players and click **Save Step** again
3. Repeat this process to build your tactic
4. Use the control panel to play:
   - **▶ Play**: Start automatic playback
   - **◀ Previous**: Go to the previous step
   - **Next ▶**: Go to the next step
   - **Slider**: Jump to any step

### Saving and Sharing Data

- **Save to Browser**: Saves to the browser (restores after reload)
- **Export JSON**: Download the tactic as a file
- **Import JSON**: Load a saved tactic file

### Adding Presets

1. From the menu, select “Export Data” and save the current tactic as a JSON file
2. Place the saved JSON file into the `presets/` directory
3. Add the file name to the `presetFiles` array in `js/presets.js`

```javascript
const presetFiles = [
  'tactics-2vs1-1.json',
  'your-new-preset.json'  // Add here
];
```

## Tech Stack

* HTML5 Canvas API
* Pure JavaScript (ES6 Modules)
* LocalStorage API
* Responsive Design

## Browser Support

Supports modern browsers (Chrome, Firefox, Safari, Edge).
