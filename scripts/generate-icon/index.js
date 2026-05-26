/**
 * Generates a Rubik's cube app icon as PNG and ICO.
 * Run: node scripts/generate-icon/index.js
 * Requires: npm install --save-dev sharp
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SIZE = 256
const PADDING = 24
const GRID = 3
const GAP = 4
const CORNER_RADIUS = 16

// Rubik's cube face colors
const COLORS = [
  ['#C41E3A', '#FF5800', '#FFD500'],
  ['#009E60', '#0051BA', '#C41E3A'],
  ['#FF5800', '#FFD500', '#0051BA'],
]

function buildSvg(size) {
  const scale = size / SIZE
  const padding = PADDING * scale
  const gap = GAP * scale
  const cornerRadius = CORNER_RADIUS * scale
  const cubeSize = size - padding * 2
  const cellSize = Math.floor((cubeSize - gap * (GRID - 1)) / GRID)
  const r = 8 * scale

  let rects = ''
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = padding + col * (cellSize + gap)
      const y = padding + row * (cellSize + gap)
      rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${r}" ry="${r}" fill="${COLORS[row][col]}" />`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#1a1a2e" />
    ${rects}
  </svg>`
}

// Minimal ICO file builder
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length
  const headerSize = 6
  const dirEntrySize = 16
  const dataOffset = headerSize + dirEntrySize * count

  // ICO header: reserved(2) + type(2) + count(2)
  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: 1 = ICO
  header.writeUInt16LE(count, 4) // image count

  const dirEntries = []
  let offset = dataOffset

  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(dirEntrySize)
    const s = sizes[i] >= 256 ? 0 : sizes[i]
    entry.writeUInt8(s, 0)                        // width
    entry.writeUInt8(s, 1)                        // height
    entry.writeUInt8(0, 2)                        // color palette
    entry.writeUInt8(0, 3)                        // reserved
    entry.writeUInt16LE(1, 4)                     // color planes
    entry.writeUInt16LE(32, 6)                    // bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8)  // image size
    entry.writeUInt32LE(offset, 12)               // data offset
    dirEntries.push(entry)
    offset += pngBuffers[i].length
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers])
}

async function generate() {
  const resourcesDir = path.join(__dirname, '..', '..', 'resources')
  const pngPath = path.join(resourcesDir, 'icon.png')
  const icoPath = path.join(resourcesDir, 'icon.ico')

  // Generate main 256px PNG
  const svg256 = buildSvg(256)
  await sharp(Buffer.from(svg256)).png().toFile(pngPath)
  console.log(`✓ PNG saved: ${pngPath}`)

  // Generate multiple sizes for ICO
  const sizes = [16, 32, 48, 64, 128, 256]
  const pngBuffers = []

  for (const size of sizes) {
    const svg = buildSvg(size)
    const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
    pngBuffers.push(buf)
  }

  const icoBuffer = buildIco(pngBuffers, sizes)
  fs.writeFileSync(icoPath, icoBuffer)
  console.log(`✓ ICO saved: ${icoPath}`)
}

generate().catch(err => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
