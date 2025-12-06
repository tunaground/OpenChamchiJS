#!/usr/bin/env node

/**
 * Downloads GeoLite2-Country.mmdb from MaxMind
 *
 * Required environment variable:
 *   MAXMIND_LICENSE_KEY - Your MaxMind license key (free account required)
 *
 * Get your license key at: https://www.maxmind.com/en/geolite2/signup
 */

import https from "https";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { execSync } from "child_process";

const EDITION_ID = "GeoLite2-Country";
const OUTPUT_PATH = path.join(process.cwd(), "lib", "GeoLite2-Country.mmdb");

async function downloadMmdb() {
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;

  if (!licenseKey) {
    console.log("MAXMIND_LICENSE_KEY not set, skipping mmdb download");

    // Check if file already exists
    if (fs.existsSync(OUTPUT_PATH)) {
      console.log("Using existing mmdb file:", OUTPUT_PATH);
      return;
    }

    console.log("Warning: No mmdb file found. Foreign IP blocking will not work.");
    return;
  }

  const url = `https://download.maxmind.com/app/geoip_download?edition_id=${EDITION_ID}&license_key=${licenseKey}&suffix=tar.gz`;

  console.log("Downloading GeoLite2-Country database...");

  // Create lib directory if it doesn't exist
  const libDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  // Download and extract
  const download = (downloadUrl) => {
    return new Promise((resolve, reject) => {
      https.get(downloadUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error("Redirect without location header"));
            return;
          }
          console.log("Following redirect...");
          download(redirectUrl).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode === 401) {
          reject(new Error("Invalid MaxMind license key"));
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

      const tempDir = path.join(process.cwd(), ".mmdb-temp");

      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tarPath = path.join(tempDir, "geolite2.tar.gz");
      const writeStream = createWriteStream(tarPath);

      response.pipe(writeStream);

      writeStream.on("finish", () => {
        writeStream.close();

        try {
          // Extract tar.gz using tar command (available on most systems including Vercel)
          execSync(`tar -xzf "${tarPath}" -C "${tempDir}"`, { stdio: "pipe" });

          // Find the mmdb file
          const entries = fs.readdirSync(tempDir);
          for (const entry of entries) {
            const entryPath = path.join(tempDir, entry);
            if (fs.statSync(entryPath).isDirectory()) {
              const mmdbPath = path.join(entryPath, `${EDITION_ID}.mmdb`);
              if (fs.existsSync(mmdbPath)) {
                fs.copyFileSync(mmdbPath, OUTPUT_PATH);
                console.log("Successfully downloaded mmdb to:", OUTPUT_PATH);
                break;
              }
            }
          }

          // Cleanup temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });

          resolve();
        } catch (err) {
          reject(err);
        }
      });

      writeStream.on("error", reject);
    }).on("error", reject);
  });
  };

  await download(url);
}

downloadMmdb().catch((err) => {
  console.error("Failed to download mmdb:", err.message);
  process.exit(1);
});
