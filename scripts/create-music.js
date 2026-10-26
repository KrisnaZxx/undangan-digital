// Komposisi instrumental asli: arpeggio sederhana dengan warna piano lembut.
import { writeFile, mkdir } from "node:fs/promises";

const sampleRate = 22050;
const beat = 0.625;
const measures = 16;
const duration = measures * 4 * beat;
const samples = new Float32Array(sampleRate * duration);
const chords = [
  [48, 55, 60, 64],
  [45, 52, 57, 60],
  [41, 48, 53, 57],
  [43, 50, 55, 59],
];
const melody = [76, 79, 76, 72, 74, 76, 72, 69, 72, 77, 76, 72, 71, 74, 72, 67];

function note(midi, start, length, volume) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const count = Math.floor(length * sampleRate);
  for (let i = 0; i < count; i++) {
    const position = Math.floor(start * sampleRate) + i;
    if (position >= samples.length) break;
    const time = i / sampleRate;
    const envelope =
      Math.min(time / 0.025, 1) *
      Math.exp(-time * 2.1) *
      Math.min((length - time) / 0.2, 1);
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const overtones =
      0.28 * Math.sin(4 * Math.PI * frequency * time) +
      0.08 * Math.sin(6 * Math.PI * frequency * time);
    samples[position] += (fundamental + overtones) * envelope * volume;
  }
}

for (let bar = 0; bar < measures; bar++) {
  const chord = chords[bar % chords.length];
  const start = bar * 4 * beat;
  for (let step = 0; step < 8; step++)
    note(
      chord[[0, 1, 2, 3, 2, 1, 3, 2][step]],
      start + (step * beat) / 2,
      2.2,
      0.12,
    );
  note(melody[bar], start + beat, 2.6, 0.11);
  note(chord[0] - 12, start, 2.5, 0.09);
}

const wav = Buffer.alloc(44 + samples.length * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(samples.length * 2, 40);
for (let i = 0; i < samples.length; i++) {
  const fade = Math.min(i / sampleRate, (samples.length - i) / sampleRate, 1);
  wav.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, samples[i] * fade)) * 32767),
    44 + i * 2,
  );
}
if (wav.length < 44 || wav.readUInt32LE(40) !== samples.length * 2)
  throw new Error("WAV tidak valid.");
await mkdir(new URL("../public/assets/audio/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL("../public/assets/audio/our-forever.wav", import.meta.url),
  wav,
);
console.log("Musik instrumental asli tersimpan (40 detik, loop).");
