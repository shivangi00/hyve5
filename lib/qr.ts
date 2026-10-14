import QRCode from 'qrcode';

/** QR code as an inline SVG string (dark modules on a transparent background). */
export async function qrSvg(url: string) {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#1d1114', light: '#0000' },
  });
}
