import { ZipAFolder } from "zip-a-folder";
import fs from "fs";
import path from "path";

// Paths
const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "dist");
const IMAGES = path.resolve(ROOT, "src/images");
const MANIFEST = path.resolve(ROOT, "manifest.json");
const OUTPUT = path.resolve(ROOT, "extension.zip");

async function zipExtension() {
  const tempFolder = path.resolve(ROOT, "temp");

  try {
    // Clean up any existing temp folder
    if (fs.existsSync(tempFolder)) {
      fs.rmSync(tempFolder, { recursive: true, force: true });
    }

    // Create temp folder
    fs.mkdirSync(tempFolder);

    // Copy dist folder
    if (fs.existsSync(DIST)) {
      fs.cpSync(DIST, path.join(tempFolder, "dist"), { recursive: true });
    } else {
      console.warn("Warning: dist folder not found. Skipping.");
    }

    // Copy images folder
    if (fs.existsSync(IMAGES)) {
      fs.cpSync(IMAGES, path.join(tempFolder, "images"), { recursive: true });
    } else {
      console.warn("Warning: images folder not found. Skipping.");
    }

    // Copy manifest.json
    if (fs.existsSync(MANIFEST)) {
      fs.copyFileSync(MANIFEST, path.join(tempFolder, "manifest.json"));
    } else {
      throw new Error("manifest.json not found. Aborting.");
    }

    // Zip the temp folder
    await ZipAFolder.zip(tempFolder, OUTPUT);

    console.log(`🎉 Extension zipped successfully: ${OUTPUT}`);
  } catch (error: any) {
    console.error(`Failed to zip extension: ${error.message || error}`);
  } finally {
    // Clean up temp folder
    if (fs.existsSync(tempFolder)) {
      fs.rmSync(tempFolder, { recursive: true, force: true });
    }
  }
}

zipExtension().catch((error: Error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
