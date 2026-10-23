import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(2, 9); // color type 2 (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each starting with filter byte 0x00 then width * 3 bytes (RGB)
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowLength);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const idatData = deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return ~c >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createICOFromPNG(pngBuf) {
  // Simple 1-image ICO wrapping 32x32 PNG
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0); // width
  dirEntry.writeUInt8(32, 1); // height
  dirEntry.writeUInt8(0, 2); // color count
  dirEntry.writeUInt8(0, 3); // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(32, 6); // bits per pixel
  dirEntry.writeUInt32LE(pngBuf.length, 8); // size
  dirEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuf]);
}

// Cyan logo color (#22D3EE -> RGB 34, 211, 238)
const cyanIcon32 = createPNG(32, 32, 34, 211, 238);
const cyanIcon180 = createPNG(180, 180, 34, 211, 238);
const cyanIcon192 = createPNG(192, 192, 34, 211, 238);
const cyanIcon512 = createPNG(512, 512, 34, 211, 238);
// OG image #0B1020 -> RGB 11, 16, 32
const ogImage = createPNG(1200, 630, 11, 16, 32);

writeFileSync('apps/web/public/apple-touch-icon.png', cyanIcon180);
writeFileSync('apps/web/public/icon-192.png', cyanIcon192);
writeFileSync('apps/web/public/icon-512.png', cyanIcon512);
writeFileSync('apps/web/public/og-image.png', ogImage);
writeFileSync('apps/web/public/favicon.ico', createICOFromPNG(cyanIcon32));

console.log('Icons and images generated successfully.');
