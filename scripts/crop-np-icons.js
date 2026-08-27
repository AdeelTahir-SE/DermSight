const sharp = require("sharp");
const path = require("path");

const SRC = path.join(
  __dirname,
  "..",
  "assets",
  "new-patient",
  "ChatGPT Image Aug 27, 2026, 04_45_52 PM.png",
);
const OUT = path.join(__dirname, "..", "assets", "icons");

(async () => {
  const meta = await sharp(SRC).metadata();
  const W = meta.width;
  const H = meta.height;
  console.log(`Source: ${W}x${H}`);

  const cols = 4;
  const rows = 3;
  const cellW = Math.floor(W / cols);
  const cellH = Math.floor(H / rows);
  console.log(`Cell: ${cellW}x${cellH}`);

  // 4 columns x 3 rows — null = empty cell
  const grid = [
    ["np-person", "np-users", "np-calendar", "np-chevron"],
    ["np-id-card", "np-envelope", "np-phone", "np-location"],
    ["np-notes", null, null, null],
  ];

  for (let c = 0; c < cols; c++) {
    const colLeft = c * cellW;
    const colW = c === cols - 1 ? W - colLeft : cellW;

    // Extract column to buffer
    const colBuf = await sharp(SRC)
      .extract({ left: colLeft, top: 0, width: colW, height: H })
      .png()
      .toBuffer();

    const colMeta = await sharp(colBuf).metadata();

    for (let r = 0; r < rows; r++) {
      const name = grid[r][c];
      if (!name) continue;

      const rowTop = r * cellH;
      const rowH = r === rows - 1 ? colMeta.height - rowTop : cellH;

      const rowBuf = await sharp(colBuf)
        .extract({ left: 0, top: rowTop, width: colMeta.width, height: rowH })
        .png()
        .toBuffer();

      await sharp(rowBuf)
        .trim({ threshold: 230 })
        .resize(256, 256, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .toFile(path.join(OUT, `${name}.png`));

      console.log(`Saved: ${name}.png (col ${c}, row ${r})`);
    }
  }

  console.log("Done");
})().catch((e) => console.error(e));
