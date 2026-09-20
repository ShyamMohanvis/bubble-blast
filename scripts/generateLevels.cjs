const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'levels');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const allColors = ['blue', 'orange', 'green', 'purple', 'red', 'yellow'];

const levelConfigs = [
    { level: 1, rows: 4, numColors: 3 },
    { level: 2, rows: 6, numColors: 3 },
    { level: 3, rows: 8, numColors: 4 },
    { level: 4, rows: 10, numColors: 4 },
    { level: 5, rows: 12, numColors: 5 },
    { level: 6, rows: 14, numColors: 5 },
    { level: 7, rows: 16, numColors: 6 },
    { level: 8, rows: 18, numColors: 6 },
    { level: 9, rows: 20, numColors: 6 },
    { level: 10, rows: 22, numColors: 6 },
];

function generateLevel(config) {
    const bubbles = [];
    const colorsToUse = allColors.slice(0, config.numColors);
    
    // We'll generate a grid of characters
    const grid = [];
    for (let r = 0; r < config.rows; r++) {
        const cols = (r % 2 === 0) ? 11 : 10;
        grid[r] = new Array(cols).fill(' ');
        
        for (let c = 0; c < cols; c++) {
            // Pick a color
            let chosenColor = colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
            
            if (c > 0 && Math.random() < 0.4) {
                chosenColor = grid[r][c-1]; // Note: chosenColor is now a string representation if we matched it, but wait!
                // Actually grid has chars like 'B', 'R'. We should work in full color strings for calculation, then convert.
            }
            
            grid[r][c] = chosenColor;
        }
    }
    
    // Now replace full colors with their first character
    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            grid[r][c] = grid[r][c].charAt(0).toUpperCase();
        }
    }
    
    return { grid };
}

levelConfigs.forEach(config => {
    const levelData = generateLevel(config);
    const filename = `level-00${config.level}.json`;
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(levelData, null, 2));
    console.log(`Generated ${filename}`);
});
