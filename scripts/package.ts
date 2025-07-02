const archiver = require('archiver')
const fs = require('fs')
const path = require('path')

// Paths
const ROOT = path.resolve(__dirname, '..')
const DIST = path.resolve(ROOT, 'dist')
const IMAGES = path.resolve(ROOT, 'src/images')
const MANIFEST = path.resolve(ROOT, 'manifest.json')
const OUTPUT = path.resolve(ROOT, 'extension.zip')
const POPUP = path.resolve(ROOT, 'src/popup/')

async function createZip(sourceFolder: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    })

    output.on('close', () => {
      console.log(`Created zip file with ${archive.pointer()} total bytes`)
      resolve()
    })

    archive.on('error', (err: any) => {
      reject(err)
    })

    // Pipe archive data to the file
    archive.pipe(output)

    // Append files from the source folder
    archive.directory(sourceFolder, false)

    // Finalize the archive
    archive.finalize()
  })
}

async function zipExtension() {
  const tempFolder = path.resolve(ROOT, 'temp')

  try {
    // Clean up any existing temp folder
    if (fs.existsSync(tempFolder)) {
      fs.rmSync(tempFolder, { recursive: true, force: true })
    }

    // Create temp folder
    fs.mkdirSync(tempFolder)

    // Copy dist folder
    if (fs.existsSync(DIST)) {
      fs.cpSync(DIST, path.join(tempFolder, 'dist'), { recursive: true })
    } else {
      console.warn('Warning: dist folder not found. Skipping.')
    }

    // Copy images folder
    if (fs.existsSync(IMAGES)) {
      fs.cpSync(IMAGES, path.join(tempFolder, 'images'), { recursive: true })
    } else {
      console.warn('Warning: images folder not found. Skipping.')
    }

    // Copy manifest.json
    if (fs.existsSync(MANIFEST)) {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
      // Update icon paths in manifest
      if (manifest.icons) {
        for (const size in manifest.icons) {
          if (manifest.icons[size]) {
            // Convert relative paths to absolute paths
            manifest.icons[size] = manifest.icons[size].replace('src/', '');
          }
        }
      }

      fs.writeFileSync(path.join(tempFolder, 'manifest.json'), JSON.stringify(manifest, null, 2))
    } else {
      throw new Error('manifest.json not found. Aborting.')
    }

    // Copy popup folder
    if (fs.existsSync(POPUP)) {
      fs.cpSync(POPUP, path.join(tempFolder, 'popup'), { recursive: true })
    } else {
      console.warn('Warning: popup folder not found. Skipping.')
    }

    // Zip the temp folder
    await createZip(tempFolder, OUTPUT)

    console.log(`🎉 Extension zipped successfully: ${OUTPUT}`)
  } catch (error: any) {
    console.error(`Failed to zip extension: ${error.message || error}`)
  } finally {
    // Clean up temp folder
    if (fs.existsSync(tempFolder)) {
      fs.rmSync(tempFolder, { recursive: true, force: true })
    }
  }
}

zipExtension().catch((error: Error) => {
  console.error(`Unexpected error: ${error.message}`)
  process.exit(1)
})
