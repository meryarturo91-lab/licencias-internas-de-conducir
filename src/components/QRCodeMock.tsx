/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { buildQrPath } from '../utils/qrMatrix';

interface QRCodeProps {
  value: string;
  size?: number;
}

// Real, scannable QR code rendered as inline SVG.
export const QRCodeSVG: React.FC<QRCodeProps> = ({ value, size = 64 }) => {
  const { d, total } = useMemo(() => buildQrPath(value), [value]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} shapeRendering="crispEdges">
      <rect width={total} height={total} fill="white" />
      <path d={d} fill="#000000" />
    </svg>
  );
};
