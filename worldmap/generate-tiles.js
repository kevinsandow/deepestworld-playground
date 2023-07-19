const fs = require('fs')

const TERRAIN_WATER = -1 // Aqua #00FFFF
const TERRAIN_EMPTY = 0 // no color
const TERRAIN_GRASS = 1 // ForestGreen #228b22
const TERRAIN_DIRT = 2
const TERRAIN_DESERT = 4 // SandyBrown #F4A460
const TERRAIN_UNDERWATER = 5
const TERRAIN_UNDERGROUND = 6
const TERRAIN_WINTER = 7 // Snow #FFFAFA
const TERRAIN_COAL = 8 // Behr - Coal Mine #54545E
const TERRAIN_WOODWALL1 = 12 // BurlyWood #DEB887
const TERRAIN_STONEROOF1 = 13 // Colortrend Stone #CEBDAB
const TERRAIN_UGFOREST = 14

const COLOR_TABLE_UNKNOWN = 0
const COLOR_TABLE_BLACK = 1
const COLOR_TABLE_AQUA = 2
const COLOR_TABLE_FOREST_GREEN = 3
const COLOR_TABLE_DIRT = 4
const COLOR_TABLE_DESERT_SAND = 5
const COLOR_TABLE_UNDERWATER = 6
const COLOR_TABLE_UNDERGROUND = 7
const COLOR_TABLE_SNOW_WHITE = 8
const COLOR_TABLE_COAL_MINE = 9
const COLOR_TABLE_BURLY_WOOD = 10
const COLOR_TABLE_STONE = 11
const COLOR_TABLE_DARK_FOREST_GREEN = 12

function getColorFromHexCode(hex) {
  return [
    parseInt(hex.substring(5, 7), 16),
    parseInt(hex.substring(3, 5), 16),
    parseInt(hex.substring(1, 3), 16),
    0,
  ]
}

const colors = [
  ...getColorFromHexCode('#dddddd'), // Unknown
  ...getColorFromHexCode('#000000'), // Black
  ...getColorFromHexCode('#00ffff'), // Aqua
  ...getColorFromHexCode('#228b22'), // Forest Green
  ...getColorFromHexCode('#9b7653'), // Dirt
  ...getColorFromHexCode('#edc9af'), // Desert Sand
  ...getColorFromHexCode('#376eff'), // Underwater
  ...getColorFromHexCode('#665a52'), // Underground
  ...getColorFromHexCode('#f4fbe4'), // Snow White
  ...getColorFromHexCode('#54545e'), // Coal Mine
  ...getColorFromHexCode('#deb887'), // Burly Wood
  ...getColorFromHexCode('#cebdab'), // Stone
  ...getColorFromHexCode('#3f5546'), // Dark Forest Green
]

function getColor(terrain) {
  switch (terrain) {
    case TERRAIN_WATER:
      return COLOR_TABLE_AQUA
    case TERRAIN_EMPTY:
      throw new Error('Should not have gotten here')
    case TERRAIN_GRASS:
      return COLOR_TABLE_FOREST_GREEN
    case TERRAIN_DIRT:
      return COLOR_TABLE_DIRT
    case TERRAIN_DESERT:
      return COLOR_TABLE_DESERT_SAND
    case TERRAIN_UNDERWATER:
      return COLOR_TABLE_UNDERWATER
    case TERRAIN_UNDERGROUND:
      return COLOR_TABLE_UNDERGROUND
    case TERRAIN_WINTER:
      return COLOR_TABLE_SNOW_WHITE
    case TERRAIN_COAL:
      return COLOR_TABLE_COAL_MINE
    case TERRAIN_WOODWALL1:
      return COLOR_TABLE_BURLY_WOOD
    case TERRAIN_STONEROOF1:
      return COLOR_TABLE_STONE
    case TERRAIN_UGFOREST:
      return COLOR_TABLE_DARK_FOREST_GREEN
    default:
      return COLOR_TABLE_UNKNOWN
  }
}

for (let l = 0; l >= -2; l -= 2) {
  for (let x = -100; x <= 100; x++) {
    for (let y = -100; y <= 100; y++) {
      try {
        const chunkName = `${l}.${y}.${x}`
        // console.log(`Reading chunk ${chunkName}`)
        const chunk = JSON.parse(fs.readFileSync(`data/${chunkName}.json`).toString())

        const terrainChunkName = `${l-1}.${y}.${x}`
        // console.log(`Reading terrain chunk ${terrainChunkName}`)
        const terrainChunk = JSON.parse(fs.readFileSync(`data/${terrainChunkName}.json`).toString())

        console.log(chunkName)

        const data = []
        for (let j = 0; j < 16; j++) {
          const line = []
          for (let i = 0; i < 16; i++) {
            if (chunk.terrain[0][j][i] !== 0) {
              line.push(COLOR_TABLE_BLACK) // non traversable
              continue
            }

            line.push(getColor(terrainChunk.terrain[0][j][i]))
          }
          data.push(line)
        }

        // console.log(data.map(d => d.join('')).join('\n'))

        createBitmapFile(`tiles/${chunkName}.bmp`, data)
      } catch (err) {
        // console.error(err)
      }
    }
  }
}

function createBitmapFile(filename, imageData) {
  const imageDataOffset = 14 + 40 + colors.length
  const fileSize = imageDataOffset + 8 * 16

  const fileContent = Buffer.alloc(fileSize)

  // The header field used to identify the BMP and DIB file
  fileContent.write('B', 0)
  fileContent.write('M', 1)

  // The size of the BMP file in bytes
  fileContent.writeInt32LE(fileSize, 2)

  // The offset, i.e. starting address, of the byte where the bitmap image data (pixel array) can be found
  fileContent.writeInt32LE(imageDataOffset, 10)

  // The size of this header, in bytes (40)
  fileContent.writeInt32LE(40, 14)

  // The bitmap width in pixels (signed integer)
  fileContent.writeInt32LE(16, 18)

  // The bitmap height in pixels (signed integer)
  fileContent.writeInt32LE(16, 22)

  // The number of color planes (must be 1)
  fileContent.writeInt16LE(1, 26)

  // The number of bits per pixel, which is the color depth of the image
  fileContent.writeInt16LE(4, 28)

  // The image size. This is the size of the raw bitmap data
  fileContent.writeInt32LE(64, 34)

  // The horizontal resolution of the image (pixel per metre, signed integer)
  fileContent.writeInt32LE(2835, 38)

  // The vertical resolution of the image (pixel per metre, signed integer)
  fileContent.writeInt32LE(2835, 42)

  // The number of colors in the color palette
  fileContent.writeInt32LE(colors.length / 4, 46)

  // The color table
  Buffer.from(colors).copy(fileContent, 54)

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x += 2) {
      fileContent.writeInt8(
        imageData[y][x] * 16 + imageData[y][x+1],
        imageDataOffset + (15 - y) * 8 + x / 2
      )
    }
  }

  fs.writeFileSync(filename, fileContent)
}
