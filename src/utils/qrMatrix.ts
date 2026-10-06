import QRCode from 'qrcode';

/** Builds a real, scannable QR path (SVG "d" string) with a 2-module quiet zone. */
export function buildQrPath(value: string): { d: string; total: number } {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const count = qr.modules.size;
  const quiet = 2;
  let d = '';
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (qr.modules.get(y, x)) d += `M${x + quiet},${y + quiet}h1v1h-1z`;
    }
  }
  return { d, total: count + quiet * 2 };
}
