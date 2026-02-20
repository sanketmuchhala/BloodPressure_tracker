/**
 * OCR utility for blood pressure monitor readings
 * - Lazy-loads tesseract.js (only when needed)
 * - Uses web worker for OCR processing
 * - Implements robust parsing for systolic, diastolic, and pulse
 * - Terminates worker after completion to free memory
 */

let tesseractModule = null;

/**
 * Lazy load Tesseract.js module
 */
async function loadTesseract() {
  if (!tesseractModule) {
    tesseractModule = await import('tesseract.js');
  }
  return tesseractModule;
}

/**
 * Perform OCR on blood pressure monitor image
 *
 * @param {File|Blob} imageFile - The compressed image file
 * @returns {Promise<{systolic: number|null, diastolic: number|null, pulse: number|null, confidence: string, rawText: string}>}
 */
export async function performOCR(imageFile) {
  let worker = null;

  try {
    // Lazy load tesseract
    const Tesseract = await loadTesseract();

    // Create worker
    worker = await Tesseract.createWorker('eng');

    // Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    console.log('OCR Raw Text:', text);

    // Parse the OCR text
    const parsed = parseBloodPressureText(text);

    // Terminate worker to free memory
    await worker.terminate();

    return {
      systolic: parsed.systolic,
      diastolic: parsed.diastolic,
      pulse: parsed.pulse,
      confidence: parsed.confidence,
      rawText: text,
    };
  } catch (error) {
    console.error('OCR Error:', error);

    // Ensure worker is terminated even on error
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('Error terminating worker:', terminateError);
      }
    }

    return {
      systolic: null,
      diastolic: null,
      pulse: null,
      confidence: 'none',
      rawText: '',
    };
  }
}

/**
 * Parse OCR text to extract blood pressure readings
 * Implements robust parsing logic with multiple strategies
 *
 * @param {string} text - OCR extracted text
 * @returns {{systolic: number|null, diastolic: number|null, pulse: number|null, confidence: string}}
 */
function parseBloodPressureText(text) {
  if (!text || typeof text !== 'string') {
    return { systolic: null, diastolic: null, pulse: null, confidence: 'none' };
  }

  // Normalize text: uppercase, remove extra whitespace
  const normalized = text.toUpperCase().replace(/\s+/g, ' ').trim();

  // Extract all 2-3 digit numbers
  const numbers = extractNumbers(normalized);

  if (numbers.length === 0) {
    return { systolic: null, diastolic: null, pulse: null, confidence: 'none' };
  }

  // Try different parsing strategies
  let result = null;

  // Strategy 1: CVS Health vertical format (three numbers stacked)
  // Optimized for CVS Health Upper Arm Series 400 monitor
  result = parseCVSVerticalFormat(text, numbers);
  if (result) {
    return { ...result, confidence: 'high' };
  }

  // Strategy 2: Look for slash pattern (120/80)
  result = parseSlashPattern(normalized, numbers);
  if (result) {
    return { ...result, confidence: 'high' };
  }

  // Strategy 3: Look for keyword-based pattern (SYS 120 DIA 80 PR 72)
  result = parseKeywordPattern(normalized, numbers);
  if (result) {
    return { ...result, confidence: 'high' };
  }

  // Strategy 4: Look for three consecutive valid numbers
  result = parseThreeNumberPattern(numbers);
  if (result) {
    return { ...result, confidence: 'medium' };
  }

  // Strategy 5: Best effort matching based on ranges
  result = parseBestEffort(numbers);
  if (result) {
    return { ...result, confidence: 'low' };
  }

  return { systolic: null, diastolic: null, pulse: null, confidence: 'none' };
}

/**
 * Extract all 2-3 digit numbers from text
 */
function extractNumbers(text) {
  const matches = text.match(/\b\d{2,3}\b/g);
  return matches ? matches.map(Number).filter(n => n >= 35 && n <= 200) : [];
}

/**
 * Strategy 1: Parse CVS Health vertical format
 * CVS Health Upper Arm Series 400 displays three numbers vertically:
 * - First line: Systolic (e.g., 123)
 * - Second line: Diastolic (e.g., 85)
 * - Third line: Pulse (e.g., 72)
 */
function parseCVSVerticalFormat(text, numbers) {
  if (numbers.length < 3) {
    return null;
  }

  // Split text by newlines and spaces to find vertically stacked numbers
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);

  // Extract numbers from each line
  const lineNumbers = [];
  for (const line of lines) {
    const lineMatches = line.match(/\b\d{2,3}\b/g);
    if (lineMatches && lineMatches.length > 0) {
      lineNumbers.push(parseInt(lineMatches[0]));
    }
  }

  // Check if we have at least 3 numbers from different lines
  if (lineNumbers.length >= 3) {
    const [first, second, third] = lineNumbers;

    // Validate ranges for CVS monitor display
    if (
      isValidSystolic(first) &&
      isValidDiastolic(second) &&
      isValidPulse(third) &&
      first > second // Systolic should be greater than diastolic
    ) {
      return {
        systolic: first,
        diastolic: second,
        pulse: third,
      };
    }
  }

  // Fallback: Try first 3 valid numbers in sequence
  // (handles cases where OCR doesn't preserve newlines perfectly)
  if (numbers.length >= 3) {
    const [n1, n2, n3] = numbers.slice(0, 3);

    if (
      isValidSystolic(n1) &&
      isValidDiastolic(n2) &&
      isValidPulse(n3) &&
      n1 > n2
    ) {
      return {
        systolic: n1,
        diastolic: n2,
        pulse: n3,
      };
    }
  }

  return null;
}

/**
 * Strategy 2: Parse slash pattern (120/80 or 120 / 80)
 */
function parseSlashPattern(text, numbers) {
  const slashPattern = /(\d{2,3})\s*\/\s*(\d{2,3})/;
  const match = text.match(slashPattern);

  if (match) {
    const first = parseInt(match[1]);
    const second = parseInt(match[2]);

    // Validate as systolic/diastolic
    if (isValidSystolic(first) && isValidDiastolic(second) && first > second) {
      // Look for pulse nearby
      const pulse = findPulse(text, numbers);
      return { systolic: first, diastolic: second, pulse };
    }
  }

  return null;
}

/**
 * Strategy 3: Parse keyword-based pattern
 */
function parseKeywordPattern(text, numbers) {
  let systolic = null;
  let diastolic = null;
  let pulse = null;

  // Keywords for each reading
  const sysKeywords = ['SYS', 'SYSTOLIC', 'S', 'UPPER'];
  const diaKeywords = ['DIA', 'DIASTOLIC', 'D', 'LOWER'];
  const pulseKeywords = ['PULSE', 'PR', 'HR', 'P', 'BPM', 'HEART'];

  // Find systolic
  systolic = findNumberNearKeywords(text, numbers, sysKeywords, isValidSystolic);

  // Find diastolic
  diastolic = findNumberNearKeywords(text, numbers, diaKeywords, isValidDiastolic);

  // Find pulse
  pulse = findNumberNearKeywords(text, numbers, pulseKeywords, isValidPulse);

  // Validate systolic > diastolic
  if (systolic && diastolic && systolic <= diastolic) {
    // Swap if needed
    [systolic, diastolic] = [diastolic, systolic];
  }

  // Return if we found at least systolic and diastolic
  if (systolic && diastolic) {
    return { systolic, diastolic, pulse };
  }

  return null;
}

/**
 * Strategy 4: Parse three consecutive valid numbers
 */
function parseThreeNumberPattern(numbers) {
  if (numbers.length < 3) {
    return null;
  }

  // Look for pattern: systolic, diastolic, pulse
  for (let i = 0; i <= numbers.length - 3; i++) {
    const [n1, n2, n3] = numbers.slice(i, i + 3);

    // Check if matches typical pattern
    if (
      isValidSystolic(n1) &&
      isValidDiastolic(n2) &&
      isValidPulse(n3) &&
      n1 > n2
    ) {
      return { systolic: n1, diastolic: n2, pulse: n3 };
    }
  }

  return null;
}

/**
 * Strategy 5: Best effort matching
 */
function parseBestEffort(numbers) {
  const systolicCandidates = numbers.filter(isValidSystolic);
  const diastolicCandidates = numbers.filter(isValidDiastolic);
  const pulseCandidates = numbers.filter(isValidPulse);

  if (systolicCandidates.length === 0 || diastolicCandidates.length === 0) {
    return null;
  }

  // Find best pair where systolic > diastolic
  let bestSystolic = null;
  let bestDiastolic = null;

  for (const sys of systolicCandidates) {
    for (const dia of diastolicCandidates) {
      if (sys > dia) {
        bestSystolic = sys;
        bestDiastolic = dia;
        break;
      }
    }
    if (bestSystolic) break;
  }

  if (!bestSystolic || !bestDiastolic) {
    return null;
  }

  const pulse = pulseCandidates.length > 0 ? pulseCandidates[0] : null;

  return { systolic: bestSystolic, diastolic: bestDiastolic, pulse };
}

/**
 * Find number near keywords
 */
function findNumberNearKeywords(text, numbers, keywords, validator) {
  for (const keyword of keywords) {
    const keywordIndex = text.indexOf(keyword);
    if (keywordIndex === -1) continue;

    // Look for numbers in the text around the keyword
    const searchArea = text.substring(
      Math.max(0, keywordIndex - 20),
      keywordIndex + 20
    );

    const matches = searchArea.match(/\b\d{2,3}\b/g);
    if (matches) {
      for (const match of matches) {
        const num = parseInt(match);
        if (validator(num)) {
          return num;
        }
      }
    }
  }

  return null;
}

/**
 * Find pulse in text (usually appears with pulse keywords)
 */
function findPulse(text, numbers) {
  const pulseKeywords = ['PULSE', 'PR', 'HR', 'P', 'BPM'];
  const pulse = findNumberNearKeywords(text, numbers, pulseKeywords, isValidPulse);

  // If not found near keywords, try third number
  if (!pulse && numbers.length >= 3) {
    const thirdNum = numbers[2];
    if (isValidPulse(thirdNum)) {
      return thirdNum;
    }
  }

  return pulse;
}

/**
 * Validation functions for ranges
 */
function isValidSystolic(num) {
  return num >= 90 && num <= 200;
}

function isValidDiastolic(num) {
  return num >= 50 && num <= 130;
}

function isValidPulse(num) {
  return num >= 35 && num <= 180;
}
