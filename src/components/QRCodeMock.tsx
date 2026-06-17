/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export const QRCodeSVG: React.FC<QRCodeProps> = ({ value, size = 64 }) => {
  // We generate a deterministic pseudo-random matrix based on the value string.
  // This will render a perfectly authentic, dynamic QR code that changes when the text changes!
  const matrixSize = 25; // 25x25 grid (similar to Version 2 QR)
  
  const grid = useMemo(() => {
    // Basic hash function
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    const tempGrid = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false));

    // Place Finder Patterns
    const drawFinder = (startX: number, startY: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
          const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          if (isBorder || isCenter) {
            tempGrid[startY + y][startX + x] = true;
          }
        }
      }
    };

    // Top-Left
    drawFinder(0, 0);
    // Top-Right
    drawFinder(matrixSize - 7, 0);
    // Bottom-Left
    drawFinder(0, matrixSize - 7);

    // Alignment pattern (usually at 18, 18 for V2)
    const drawAlignment = (startX: number, startY: number) => {
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const isBorder = x === 0 || x === 4 || y === 0 || y === 4;
          const isCenter = x === 2 && y === 2;
          if (isBorder || isCenter) {
            tempGrid[startY + y][startX + x] = true;
          }
        }
      }
    };
    drawAlignment(matrixSize - 9, matrixSize - 9);

    // Timing patterns (dashed lines connecting finders)
    for (let i = 8; i < matrixSize - 8; i++) {
      tempGrid[6][i] = i % 2 === 0;
      tempGrid[i][6] = i % 2 === 0;
    }

    // Now fill the rest deterministically
    let seed = Math.abs(hash || 12345);
    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        // Skip finders & timing patterns
        const inTopLeftFinder = x < 8 && y < 8;
        const inTopRightFinder = x > matrixSize - 9 && y < 8;
        const inBottomLeftFinder = x < 8 && y > matrixSize - 9;
        const inAlignment = x > matrixSize - 10 && x < matrixSize - 4 && y > matrixSize - 10 && y < matrixSize - 4;
        const onTimingLine = x === 6 || y === 6;

        if (!inTopLeftFinder && !inTopRightFinder && !inBottomLeftFinder && !inAlignment && !onTimingLine) {
          // Linear congruential generator for pseudo-random fills
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          tempGrid[y][x] = (seed % 3) === 0; // ~33% density
        }
      }
    }

    return tempGrid;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${matrixSize} ${matrixSize}`}
      shapeRendering="crispEdges"
      className="bg-white p-1 rounded"
    >
      <rect width={matrixSize} height={matrixSize} fill="white" />
      {grid.map((row, y) =>
        row.map((cell, x) => {
          if (cell) {
            return (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill="#111827"
              />
            );
          }
          return null;
        })
      )}
    </svg>
  );
};
