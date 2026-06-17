/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility to process standard Google Drive sharing links and return direct,
 * embeddable endpoints for standard html elements.
 * 
 * Target GDrive link:
 * https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * -> Transforms to:
 * https://lh3.googleusercontent.com/d/FILE_ID
 */
export function getEmbeddableUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  // Google Drive standard file sharing URL
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
  }
  
  // Google Drive direct UC params or open params
  const paramIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && paramIdMatch && paramIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${paramIdMatch[1]}`;
  }
  
  // Return standard direct image URL or base64
  return trimmed;
}
