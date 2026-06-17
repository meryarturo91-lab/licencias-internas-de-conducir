/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts any OKLCH color string (like "oklch(0.92 0.01 251.41)" or "oklch(0.24 0.05 241 / 0.5)")
 * into a standard rgb/rgba color string that html2canvas can parse without crashing.
 * Supports percentages, degrees unit, commas, and modern space separation.
 */
export function replaceOklchInString(str: string): string {
  if (typeof str !== 'string' || !str.includes('oklch')) return str;

  // Supports: oklch(L C H), oklch(L C H / A), using spaces or commas, with percentages or angles
  const oklchRegex = /\boklch\(\s*([\d.e%-]+)(?:\s+|,\s*)([\d.e%-]+)(?:\s+|,\s*)([\d.e%-]+deg|[\d.e%-]+)(?:\s*[\/\s,]\s*([\d.e%-]+))?\s*\)/gi;

  return str.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
    try {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) {
        l = l / 100;
      }
      
      let c = parseFloat(cStr);
      if (cStr.includes('%')) {
        c = c / 100;
      }

      let h = parseFloat(hStr); // parseFloat ignores 'deg' or 'rad' automatically

      let a = 1;
      if (aStr) {
        if (aStr.includes('%')) {
          a = parseFloat(aStr) / 100;
        } else {
          a = parseFloat(aStr);
        }
      }

      // Guard values in valid standard bounds
      l = Math.max(0, Math.min(1, isNaN(l) ? 1 : l));
      c = Math.max(0, Math.min(1, isNaN(c) ? 0 : c));
      h = isNaN(h) ? 0 : h;
      a = Math.max(0, Math.min(1, isNaN(a) ? 1 : a));

      // OKLCH -> OKLab
      const hRad = (h * Math.PI) / 180;
      const a_ = c * Math.cos(hRad);
      const b_ = c * Math.sin(hRad);

      // OKLab -> LMS (LMS values are cube-rooted here)
      const l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
      const m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
      const s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

      // Cube of LMS
      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      // LMS -> Linear sRGB
      const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const b_val = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      // Linear sRGB -> Standard sRGB (with gamma correction)
      const f = (x: number) => {
        if (isNaN(x)) return 0;
        if (x <= 0.0031308) return 12.92 * x;
        return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };

      const R = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
      const G = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
      const B = Math.round(Math.max(0, Math.min(1, f(b_val))) * 255);

      if (a !== 1) {
        return `rgba(${R}, ${G}, ${B}, ${a})`;
      } else {
        return `rgb(${R}, ${G}, ${B})`;
      }
    } catch (err) {
      console.warn('Failed parsing individual OKLCH color:', match, err);
      return 'rgb(0, 0, 0)'; // safe fallback
    }
  });
}

/**
 * Converts any OKLab color string (like "oklab(0.92 0.01 -0.04)" or "oklab(0.24 0.05 0.1 / 0.5)")
 * into a standard rgb/rgba color string that html2canvas can parse without crashing.
 */
export function replaceOklabInString(str: string): string {
  if (typeof str !== 'string' || !str.includes('oklab')) return str;

  // Supports: oklab(L A B), oklab(L A B / Alpha), using spaces or commas
  const oklabRegex = /\boklab\(\s*([\d.e%-]+)(?:\s+|,\s*)([\d.e%-]+)(?:\s+|,\s*)([\d.e%-]+)(?:\s*[\/\s,]\s*([\d.e%-]+))?\s*\)/gi;

  return str.replace(oklabRegex, (match, lStr, aStr, bStr, alphaStr) => {
    try {
      let l = parseFloat(lStr);
      if (lStr.includes('%')) {
        l = l / 100;
      }
      
      let a_ = parseFloat(aStr);
      if (aStr.includes('%')) {
        a_ = a_ / 100;
      }

      let b_ = parseFloat(bStr);
      if (bStr.includes('%')) {
        b_ = b_ / 100;
      }

      let a = 1;
      if (alphaStr) {
        if (alphaStr.includes('%')) {
          a = parseFloat(alphaStr) / 100;
        } else {
          a = parseFloat(alphaStr);
        }
      }

      // Guard values in valid standard bounds
      l = Math.max(0, Math.min(1, isNaN(l) ? 1 : l));
      a_ = isNaN(a_) ? 0 : a_;
      b_ = isNaN(b_) ? 0 : b_;
      a = Math.max(0, Math.min(1, isNaN(a) ? 1 : a));

      // OKLab -> LMS (LMS values are cube-rooted here)
      const l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
      const m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
      const s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

      // Cube of LMS
      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      // LMS -> Linear sRGB
      const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const b_val = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      // Linear sRGB -> Standard sRGB (with gamma correction)
      const f = (x: number) => {
        if (isNaN(x)) return 0;
        if (x <= 0.0031308) return 12.92 * x;
        return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };

      const R = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
      const G = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
      const B = Math.round(Math.max(0, Math.min(1, f(b_val))) * 255);

      if (a !== 1) {
        return `rgba(${R}, ${G}, ${B}, ${a})`;
      } else {
        return `rgb(${R}, ${G}, ${B})`;
      }
    } catch (err) {
      console.warn('Failed parsing individual OKLab color:', match, err);
      return 'rgb(0, 0, 0)'; // safe fallback
    }
  });
}

/**
 * Combined dynamic color converter for oklch and oklab strings.
 */
export function convertColorsInString(str: string): string {
  if (typeof str !== 'string') return str;
  let out = str;
  if (out.includes('oklch')) {
    out = replaceOklchInString(out);
  }
  if (out.includes('oklab')) {
    out = replaceOklabInString(out);
  }
  return out;
}

let originalGetComputedStyle: typeof window.getComputedStyle | null = null;

/**
 * Temporary patch for window.getComputedStyle so that html2canvas receives standard colors
 * instead of the unsupported OKLCH/OKLab values built into modern browser CSSOM engines.
 */
export function interceptGetComputedStyle(): () => void {
  if (originalGetComputedStyle) return () => {}; // already patched

  originalGetComputedStyle = window.getComputedStyle;

  window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
    const style = originalGetComputedStyle!(elt, pseudoElt);
    
    // Create a proxy to intercept color property queries in css rule evaluation
    const styleProxy = new Proxy(style, {
      get(target, prop, receiver) {
        // Use target instead of receiver as the 'this' context to prevent Illegal invocation on native getters
        const val = Reflect.get(target, prop, target);

        if (prop === 'getPropertyValue') {
          return (propertyName: string) => {
            const rawVal = target.getPropertyValue(propertyName);
            if (typeof rawVal === 'string' && (rawVal.includes('oklch') || rawVal.includes('oklab'))) {
              return convertColorsInString(rawVal);
            }
            return rawVal;
          };
        }

        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          return convertColorsInString(val);
        }

        if (typeof val === 'function') {
          return val.bind(target);
        }

        return val;
      }
    });

    return styleProxy;
  };

  return () => {
    if (originalGetComputedStyle) {
      window.getComputedStyle = originalGetComputedStyle;
      originalGetComputedStyle = null;
    }
  };
}

/**
 * Pre-processes the DOM of the active page to inline and sanitize
 * all stylesheet references, style blocks, and inline styles
 * prior to drawing with html2canvas.
 */
export async function prepareStylesForPrint(): Promise<void> {
  // 1. Process all link stylesheets on the active document
  // Convert link stylesheets into inline style tags, sanitizing them in the process.
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  for (const link of links) {
    try {
      const href = (link as HTMLLinkElement).href;
      if (href) {
        // Only fetch if from the same origin to avoid cors issues
        if (href.startsWith(window.location.origin) || href.startsWith('/')) {
          const response = await fetch(href);
          const cssText = await response.text();
          const cleanedCss = convertColorsInString(cssText);

          const style = document.createElement('style');
          style.textContent = cleanedCss;
          style.setAttribute('data-converted-from', href);

          if (link.parentNode) {
            link.parentNode.insertBefore(style, link);
            link.parentNode.removeChild(link);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to inline stylesheet background rules:', e);
    }
  }

  // 2. Process all existing style tags
  const styles = Array.from(document.querySelectorAll('style'));
  styles.forEach((style) => {
    if (style.textContent && !style.getAttribute('data-converted-from')) {
      style.textContent = convertColorsInString(style.textContent);
    }
  });

  // 3. Process all elements with custom inline style attributes
  const elementsWithStyle = Array.from(document.querySelectorAll('[style]'));
  elementsWithStyle.forEach((elem) => {
    const styleAttr = elem.getAttribute('style');
    if (styleAttr) {
      elem.setAttribute('style', convertColorsInString(styleAttr));
    }
  });
}
