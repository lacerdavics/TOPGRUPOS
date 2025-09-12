import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Decode HTML entities in text (fix titles like "Let&#39;s Pump Memes&#33;")
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  const entityMap: { [key: string]: string } = {
    '&#39;': "'",
    '&#33;': '!',
    '&#34;': '"',
    '&#35;': '#',
    '&#36;': '$',
    '&#37;': '%',
    '&#38;': '&',
    '&#40;': '(',
    '&#41;': ')',
    '&#42;': '*',
    '&#43;': '+',
    '&#44;': ',',
    '&#45;': '-',
    '&#46;': '.',
    '&#47;': '/',
    '&#58;': ':',
    '&#59;': ';',
    '&#60;': '<',
    '&#61;': '=',
    '&#62;': '>',
    '&#63;': '?',
    '&#64;': '@',
    '&#91;': '[',
    '&#92;': '\\',
    '&#93;': ']',
    '&#94;': '^',
    '&#95;': '_',
    '&#96;': '`',
    '&#123;': '{',
    '&#124;': '|',
    '&#125;': '}',
    '&#126;': '~',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' '
  };
  
  let decoded = text;
  
  // Replace known entities
  Object.entries(entityMap).forEach(([entity, char]) => {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  });
  
  // Handle numeric entities (&#123; format)
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // Handle hex entities (&#x1A; format)
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Also normalize unicode characters
  decoded = normalizeUnicodeText(decoded);
  
  return decoded;
}

// Normalize unicode characters to basic ASCII equivalents
export function normalizeUnicodeText(text: string): string {
  if (!text) return text;
  
  // Map of mathematical unicode characters to normal ASCII
  const unicodeMap: { [key: string]: string } = {
    // Mathematical bold letters
    '𝐀': 'A', '𝐁': 'B', '𝐂': 'C', '𝐃': 'D', '𝐄': 'E', '𝐅': 'F', '𝐆': 'G', '𝐇': 'H', '𝐈': 'I', '𝐉': 'J',
    '𝐊': 'K', '𝐋': 'L', '𝐌': 'M', '𝐍': 'N', '𝐎': 'O', '𝐏': 'P', '𝐐': 'Q', '𝐑': 'R', '𝐒': 'S', '𝐓': 'T',
    '𝐔': 'U', '𝐕': 'V', '𝐖': 'W', '𝐗': 'X', '𝐘': 'Y', '𝐙': 'Z',
    '𝐚': 'a', '𝐛': 'b', '𝐜': 'c', '𝐝': 'd', '𝐞': 'e', '𝐟': 'f', '𝐠': 'g', '𝐡': 'h', '𝐢': 'i', '𝐣': 'j',
    '𝐤': 'k', '𝐥': 'l', '𝐦': 'm', '𝐧': 'n', '𝐨': 'o', '𝐩': 'p', '𝐪': 'q', '𝐫': 'r', '𝐬': 's', '𝐭': 't',
    '𝐮': 'u', '𝐯': 'v', '𝐰': 'w', '𝐱': 'x', '𝐲': 'y', '𝐳': 'z',
    // Mathematical bold numbers
    '𝟎': '0', '𝟏': '1', '𝟐': '2', '𝟑': '3', '𝟒': '4', '𝟓': '5', '𝟔': '6', '𝟕': '7', '𝟖': '8', '𝟗': '9',
    // Mathematical italic letters
    '𝑨': 'A', '𝑩': 'B', '𝑪': 'C', '𝑫': 'D', '𝑬': 'E', '𝑭': 'F', '𝑮': 'G', '𝑯': 'H', '𝑰': 'I', '𝑱': 'J',
    '𝑲': 'K', '𝑳': 'L', '𝑴': 'M', '𝑵': 'N', '𝑶': 'O', '𝑷': 'P', '𝑸': 'Q', '𝑹': 'R', '𝑺': 'S', '𝑻': 'T',
    '𝑼': 'U', '𝑽': 'V', '𝑾': 'W', '𝑿': 'X', '𝒀': 'Y', '𝒁': 'Z',
    '𝒂': 'a', '𝒃': 'b', '𝒄': 'c', '𝒅': 'd', '𝒆': 'e', '𝒇': 'f', '𝒈': 'g', '𝒉': 'h', '𝒊': 'i', '𝒋': 'j',
    '𝒌': 'k', '𝒍': 'l', '𝒎': 'm', '𝒏': 'n', '𝒐': 'o', '𝒑': 'p', '𝒒': 'q', '𝒓': 'r', '𝒔': 's', '𝒕': 't',
    '𝒖': 'u', '𝒗': 'v', '𝒘': 'w', '𝒙': 'x', '𝒚': 'y', '𝒛': 'z'
  };
  
  let normalized = text;
  
  // Replace unicode mathematical characters
  Object.entries(unicodeMap).forEach(([unicode, ascii]) => {
    normalized = normalized.replace(new RegExp(unicode, 'g'), ascii);
  });
  
  // Remove any remaining problematic unicode characters that might cause display issues
  normalized = normalized.replace(/[\uFFFD]/g, ''); // Remove replacement characters
  
  return normalized;
}
