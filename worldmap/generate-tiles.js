const fs = require('fs')

const input = process.argv[2]

try {
    const chunks = JSON.parse(fs.readFileSync(input).toString())

    for (const [chunkName, chunk] of Object.entries(chunks)) {
        const [l, y, x] = chunkName.split('.').map(Number)
        console.log(`Processing ${l},${x},${y}`)
        if (l % 2 !== 0) {
            console.warn('Skipping odd layers for now')
            continue
        }

        console.log('raw:')
        console.log(chunk[0].map(r => r.join('')).join('\n'))
        console.log('binary:')
        console.log(chunk[0].map(r => r.reduce((memo, v) => memo * 2 + (v !== 0 ? 1 : 0), 0).toString(2).padStart(16, '0')).join('\n'))

        const data = chunk[0]
            .map(r => [
                r.slice(0, 8).reduce((memo, v) => memo * 2 + (v !== 0 ? 1 : 0), 0),
                r.slice(8, 16).reduce((memo, v) => memo * 2 + (v !== 0 ? 1 : 0), 0),
            ])
            .reverse()
            .flat()

        createBitmapFile(`tiles/${chunkName}.bmp`, Buffer.from(data))
    }
} catch (err) {
    console.error(err)
}

function createBitmapFile(filename, unpaddedImageData) {
    const colorTable = Buffer.from([
        0xFF, 0xFF, 0xFF, 0x00,
        0x00, 0x00, 0x00, 0x00,
    ])

    let fileContent = Buffer.alloc(126)

    fileContent.write('B', 0)
    fileContent.write('M', 1)
    fileContent.writeInt32LE(128, 2)
    fileContent.writeInt32LE(0, 6)
    fileContent.writeInt32LE(62, 10)
    fileContent.writeInt32LE(40, 14)
    fileContent.writeInt32LE(16, 18)
    fileContent.writeInt32LE(16, 22)
    fileContent.writeInt16LE(1, 26)
    fileContent.writeInt16LE(1, 28)
    fileContent.writeInt32LE(64, 34)
    fileContent.writeInt32LE(2835, 38)
    fileContent.writeInt32LE(2835, 42)

    colorTable.copy(fileContent, 54)

    for (let i = 0; i < 16; i++) {
        unpaddedImageData.copy(
            fileContent,
            4 * i + 62,
            2 * i,
            2 * i + 2
        )
    }

    fs.writeFileSync(filename, fileContent)
}
