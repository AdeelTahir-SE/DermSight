const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'assets', 'splash', 'splash-icons.png');
const OUT = path.join(__dirname, '..', 'assets', 'icons');

const CELL_W = 512;
const CELL_H = 512;

const icons = [
  { name: 'ai-chip',       col: 0, row: 0 },
  { name: 'offline-cloud', col: 1, row: 0 },
  { name: 'upload-cloud',  col: 2, row: 0 },
  { name: 'camera',        col: 0, row: 1 },
  { name: 'image',         col: 1, row: 1 },
  { name: 'location-pin',  col: 2, row: 1 },
];

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  for (const icon of icons) {
    const outPath = path.join(OUT, `${icon.name}.png`);
    await sharp(SRC)
      .extract({
        left: icon.col * CELL_W,
        top: icon.row * CELL_H,
        width: CELL_W,
        height: CELL_H,
      })
      .toFile(outPath);
    console.log(`Saved: ${icon.name}.png`);
  }
  console.log('Done');
}

main().catch(console.error);
