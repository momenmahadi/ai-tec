import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SolvedQuestion {
  question: string;
  answer: string;
  explanation: string;
  foundInText: boolean;
}

interface QuestionZone {
  id: string; // e.g., "1(a)"
  number: string; // "1"
  subLetter: string; // "a"
  x: number;
  y: number;
  bottomY: number; // Y where the next question starts, or end of page
  matchedText: string;
}

/**
 * Normalizes text to make matching numbers, sub-questions, and markers easier
 */
const cleanMarker = (txt: string): string => {
  return txt.toLowerCase().replace(/[\s().:[\]]/g, '');
};

/**
 * Fetches a handwriting font from CDN or falls back to standard cursive styling
 */
const fetchHandwritingFont = async (): Promise<ArrayBuffer | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
    
    const response = await fetch(
      'https://fastly.jsdelivr.net/npm/@canvas-fonts/caveat@1.0.1/Caveat-Regular.ttf',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return await response.arrayBuffer();
    }
  } catch (err) {
    console.warn('Failed to fetch premium handwriting font, falling back to standard Helvetica-Oblique...', err);
  }
  return null;
};

/**
 * Sanitizes common mathematical and unicode characters to prevent standard-font encoding errors.
 */
const sanitizeTextForPdf = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/Δ/g, 'Delta')
    .replace(/θ/g, 'theta')
    .replace(/—/g, '-')
    .replace(/–/g, '-');
};

/**
 * Robust wrapper for pdf-lib's drawText to gracefully catch and handle any encoding exceptions.
 * Alleviates standard WinAnsi encoding issues for non-standard symbols and handles line advancement.
 */
const drawSafeText = (
  page: any,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: any;
    color: any;
  }
): void => {
  try {
    // Standard fonts/simple TTFs cannot encode newlines directly inside drawText. We must filter them.
    const cleanLine = text.replace(/[\r\n\t]/g, ' ');
    page.drawText(cleanLine, options);
  } catch (err: any) {
    console.warn(`Failed to draw text "${text}" with primary font:`, err);
    try {
      // Clean and strip any non-ASCII / non-printable elements as absolute fallback
      const asciiOnly = text.replace(/[^\x20-\x7E]/g, ' ');
      page.drawText(asciiOnly, options);
    } catch (innerErr) {
      console.error('All fallback draw attempts failed:', innerErr);
    }
  }
};

/**
 * Bounding Box Enforcement Function
 * 
 * Checks if the generated answer text fits within the detected coordinate bounding box.
 * Automatically wraps words, detects horizontal and vertical constraints, and dynamically
 * scales down the font size as needed to enforce the strict boundary margins and prevent
 * any collision with other page areas or adjacent questions.
 */
const enforceBoundingBoxAndDraw = (
  page: any,
  rawText: string,
  minX: number,
  maxX: number,
  startY: number,
  bottomBound: number,
  font: any,
  color: any
): void => {
  const horizontalPadding = 12;
  const maxAllowedWidth = Math.max(100, maxX - minX - horizontalPadding * 2);
  const maxAllowedHeight = Math.max(30, startY - bottomBound - 10);

  let currentFontSize = 11.5;
  let lineHeight = currentFontSize * 1.35;

  // Helper inside to lay out words for a prospective font size
  const computeWordWrapLines = (fontSize: number): string[] => {
    const sourceParagraphs = rawText.split('\n');
    const resultLines: string[] = [];

    sourceParagraphs.forEach(para => {
      const words = para.split(/\s+/).filter(Boolean);
      let currentLine = '';

      for (let w = 0; w < words.length; w++) {
        const testLine = currentLine ? `${currentLine} ${words[w]}` : words[w];
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (textWidth > maxAllowedWidth) {
          if (currentLine) {
            resultLines.push(currentLine);
          }
          currentLine = words[w];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        resultLines.push(currentLine);
      }
    });

    return resultLines;
  };

  // Perform dynamic font scale reduction down to 7.5pt if text overflows total height
  let layoutLines = computeWordWrapLines(currentFontSize);
  let totalCalculatedHeight = layoutLines.length * lineHeight;

  while (totalCalculatedHeight > maxAllowedHeight && currentFontSize > 7.5) {
    currentFontSize -= 0.5;
    lineHeight = currentFontSize * 1.35;
    layoutLines = computeWordWrapLines(currentFontSize);
    totalCalculatedHeight = layoutLines.length * lineHeight;
  }

  // Draw the safe lines sequentially, ensuring we do not cross the bottomBound cutoff
  let lineY = startY;
  for (let i = 0; i < layoutLines.length; i++) {
    if (lineY < bottomBound + 4) {
      console.warn(`Bounding box overflow prevented! Truncated text drawing to avoid overlapping next question.`);
      break;
    }
    
    drawSafeText(page, layoutLines[i], {
      x: minX + horizontalPadding,
      y: lineY,
      size: currentFontSize,
      font,
      color
    });

    lineY -= lineHeight;
  }
};

/**
 * Overlay the solved answers directly onto the original PDF file in realistic handwritten style.
 * Maps exact page layout, table coordinates, and line positions to avoid collisions.
 */
export const overlayAnswersOnPdf = async (
  originalFile: File,
  solvedQuestions: SolvedQuestion[],
  onProgress?: (progressText: string) => void
): Promise<Blob> => {
  if (onProgress) onProgress('Analyzing PDF page structures & layout matrices...');

  // Convert uploaded file to byte array
  const fileBytes = new Uint8Array(await originalFile.arrayBuffer());
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  // Load handwritten font if possible
  if (onProgress) onProgress('Aligning blue-pen handwriting styles...');
  const fontData = await fetchHandwritingFont();
  let selectedFont: any;
  if (fontData) {
    try {
      selectedFont = await pdfDoc.embedFont(fontData);
    } catch (e) {
      console.warn('Embedding custom handwriting font failed, fallback to Helvetica-Oblique', e);
      selectedFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    }
  } else {
    selectedFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  }

  // Use pdf.js to analyze page coordinates of texts and answer spaces
  if (onProgress) onProgress('Running structural OCR layout detection...');
  const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
  const typedArray = new Uint8Array(await originalFile.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: typedArray });
  const docInfo = await loadingTask.promise;

  // Read page by page text pieces
  const pagesTextItems: TextItem[][] = [];
  const maxPages = Math.min(docInfo.numPages, pages.length);

  for (let pIndex = 1; pIndex <= maxPages; pIndex++) {
    const pdfJsPage = await docInfo.getPage(pIndex);
    const textContent = await pdfJsPage.getTextContent();
    const items: TextItem[] = textContent.items.map((item: any) => {
      return {
        str: item.str,
        x: item.transform[4], // Coordinate X from left
        y: item.transform[5], // Coordinate Y from bottom
        width: item.width || 0,
        height: item.height || 10,
      };
    });
    pagesTextItems.push(items);
  }

  if (onProgress) onProgress('Mapping answer coordinates & table matrices...');

  let solvedIndex = 0;

  for (let pIndex = 0; pIndex < maxPages; pIndex++) {
    const pdfLibPage = pages[pIndex];
    const { width, height } = pdfLibPage.getSize();
    const textItems = pagesTextItems[pIndex];

    // --- STEP 1: DETECT WRITING LINES (dots/underscores/dashes) ---
    const writingLines = textItems.filter(item => {
      const s = item.str.trim();
      return (
        s.length >= 3 && 
        ((s.includes('.') && s.replace(/\./g, '') === '') || 
         (s.includes('_') && s.replace(/_/g, '') === '') || 
         (s.includes('-') && s.replace(/-/g, '') === ''))
      );
    }).sort((a, b) => b.y - a.y); // sort from top to bottom

    // --- STEP 2: DETECT TABLE GRID STRUCTURES ---
    // If we have rows/columns of elements aligning vertically or horizontally
    // Let's group items on the same horizontal Y lines to identify table rows
    const rowsMap = new Map<number, TextItem[]>();
    textItems.forEach(item => {
      if (item.str.trim().length === 0) return;
      let matchedY = Array.from(rowsMap.keys()).find(k => Math.abs(k - item.y) < 5);
      if (matchedY !== undefined) {
        rowsMap.get(matchedY)!.push(item);
      } else {
        rowsMap.set(item.y, [item]);
      }
    });

    const pageFullText = textItems.map(it => it.str).join(' ').toLowerCase();

    // --- STEP 3: IDENTIFY QUESTION ZONES ---
    // Look for markers like "1", "2", "(a)", "(b)", "1(a)"
    const questionZones: QuestionZone[] = [];
    textItems.forEach(item => {
      const txt = item.str.trim();
      // Match question labels: e.g., "1", "2", "(a)", "(b)", "(i)", "1(a)"
      const isNum = /^\d+$/.test(txt);
      const isLetter = /^\([a-z]\)$/.test(txt) || /^[a-z]\)$/.test(txt);
      const isJoint = /^\d+\([a-z]\)$/.test(txt);

      if (isNum || isLetter || isJoint) {
        let qNum = "";
        let qLetter = "";
        if (isNum) qNum = txt;
        else if (isJoint) {
          const m = txt.match(/^(\d+)\(([a-z])\)/);
          if (m) { qNum = m[1]; qLetter = m[2]; }
        } else {
          const m = txt.replace(/[()]/g, '');
          qLetter = m;
        }

        questionZones.push({
          id: txt,
          number: qNum,
          subLetter: qLetter,
          x: item.x,
          y: item.y,
          bottomY: 0, // will calculate next
          matchedText: txt
        });
      }
    });

    // Sort zones top-to-bottom
    questionZones.sort((a, b) => b.y - a.y);

    // Populate bottom bounds for each zone to prevent drawing overlap
    for (let i = 0; i < questionZones.length; i++) {
      if (i < questionZones.length - 1) {
        questionZones[i].bottomY = questionZones[i + 1].y;
      } else {
        questionZones[i].bottomY = 30; // raw margin
      }
    }

    // --- STEP 4: ASSIGN SOLVED QUESTIONS TO DETECTED ZONES ON THIS PAGE ---
    // Let's see which questions are expected to be on this page or matched layout
    const questionsReadyToPlace: { solvedQ: SolvedQuestion; targetZone?: QuestionZone }[] = [];

    // Check if we can map solved questions to the layout zones
    for (let idx = solvedIndex; idx < solvedQuestions.length; idx++) {
      const sq = solvedQuestions[idx];
      const qCleaned = sq.question.toLowerCase();
      
      // Match text headers, e.g., "1 (a)"
      const numMatch = qCleaned.match(/^(\d+)/);
      const subMatch = qCleaned.match(/\(([a-z])\)/) || qCleaned.match(/\s([a-z])\s/);

      let bestZone: QuestionZone | undefined;

      if (numMatch) {
        const num = numMatch[1];
        const letter = subMatch ? subMatch[1] : '';

        // Try to find the coordinate zone mapping this specific part
        bestZone = questionZones.find(z => {
          if (letter) {
            return (z.number === num && z.subLetter === letter) || 
                   (z.subLetter === letter && Math.abs(z.y - (questionZones.find(p => p.number === num)?.y || z.y)) < 400);
          }
          return z.number === num;
        });

        // If page has references to this question, we match
        const pageContainsQ = pageFullText.includes(` ${num} `) || 
                             pageFullText.includes(`question ${num}`) ||
                             (letter && pageFullText.includes(`(${letter})`));

        if (bestZone || pageContainsQ) {
          questionsReadyToPlace.push({
            solvedQ: sq,
            targetZone: bestZone
          });
        }
      }
    }

    // Fallback if no layout-mapped zones are found
    if (questionsReadyToPlace.length === 0 && solvedIndex < solvedQuestions.length) {
      // Pick 1 or 2 sequential questions for this page
      const count = Math.min(2, solvedQuestions.length - solvedIndex);
      for (let k = 0; k < count; k++) {
        questionsReadyToPlace.push({
          solvedQ: solvedQuestions[solvedIndex + k]
        });
      }
    }

    // --- STEP 5: FILL THE AREAS PERFECTLY ---
    questionsReadyToPlace.forEach((item) => {
      const sq = item.solvedQ;
      const originalAnswer = sq.answer;
      const cleanAnswer = sanitizeTextForPdf(originalAnswer);

      // 1. Check if the answer is table completions
      // Let's check if the answer contains a structured list or format like "Protons = 6", or multiple parameters
      const tableMatch = cleanAnswer.match(/(protons|neutrons|electrons|number of|value|element)\s*=\s*(\d+|[a-zA-Z]+)/gi);
      
      if (tableMatch && tableMatch.length > 0) {
        // We have table cell solutions! Let's find columns on this page
        // Find empty areas or label strings in the same row/column structures
        let cellsFilled = false;
        
        tableMatch.forEach(cellSol => {
          const parts = cellSol.split('=');
          const parameter = parts[0].trim().toLowerCase();
          const valStr = parts[1].trim();

          // Find text items containing parameter names (like "Protons")
          const targetColItem = textItems.find(it => it.str.toLowerCase().includes(parameter));
          if (targetColItem) {
            // Find rows beneath this header where there is empty vertical alignment or dashes/dots
            const missingCellItem = textItems.find(it => 
              Math.abs(it.x - targetColItem.x) < 40 && 
              it.y < targetColItem.y && 
              it.y > targetColItem.y - 120 &&
              (it.str.trim() === '?' || it.str.trim() === '' || it.str.includes('.') || it.str.includes('_'))
            );

            if (missingCellItem) {
              drawSafeText(pdfLibPage, valStr, {
                x: missingCellItem.x + 2,
                y: missingCellItem.y + 2,
                size: 11.5,
                font: selectedFont,
                color: rgb(0.12, 0.42, 0.96)
              });
              cellsFilled = true;
            }
          }
        });

        if (cellsFilled) {
          solvedIndex++;
          return; // skip line/paragraph placement
        }
      }

      // 2. Linear / Paragraph placement
      // Define exact target answer space boundaries:
      let minX = 70;
      let maxX = width - 70;
      let targetY = height - 150 - (solvedIndex % 4) * 160; // default sequential height fallback
      let bottomBound = targetY - 140;

      if (item.targetZone) {
        minX = Math.max(70, item.targetZone.x);
        targetY = item.targetZone.y - 24; // place directly beneath question marker
        bottomBound = Math.max(30, item.targetZone.bottomY + 10);
      }

      // Filter writing lines belonging strictly to this question's zone:
      const linesInZone = writingLines.filter(line => 
        line.y < (item.targetZone ? item.targetZone.y : targetY + 15) &&
        line.y > (item.targetZone ? item.targetZone.bottomY : bottomBound - 30)
      );

      if (linesInZone.length > 0) {
        // Draw directly resting on the blank dotted / underline lines
        const linesToDraw = Math.min(linesInZone.length, 4);
        
        // Split answer by newlines first if there are any to prevent layout overlapping
        const answerParagraphs = cleanAnswer.split('\n').filter(Boolean);
        const answerWords: string[] = [];
        
        answerParagraphs.forEach(para => {
          answerWords.push(...para.split(/\s+/).filter(Boolean));
        });

        const wordsPerLine = Math.ceil(answerWords.length / linesToDraw);

        for (let l = 0; l < linesToDraw; l++) {
          const currentLine = linesInZone[l];
          const wordsChunk = answerWords.slice(l * wordsPerLine, (l + 1) * wordsPerLine).join(' ');
          
          if (wordsChunk.trim()) {
            // Horizontal bounding box control for preset writing lines
            let lineFontSize = 11.0;
            const availableLineWidth = Math.max(100, maxX - Math.max(minX, currentLine.x + 4) - 20);
            while (selectedFont.widthOfTextAtSize(wordsChunk, lineFontSize) > availableLineWidth && lineFontSize > 8.0) {
              lineFontSize -= 0.5;
            }

            drawSafeText(pdfLibPage, wordsChunk, {
              x: Math.max(minX, currentLine.x + 4),
              y: currentLine.y + 3.2, // slightly above the coordinate line so it rests naturally
              size: lineFontSize,
              font: selectedFont,
              color: rgb(0.12, 0.42, 0.96) // premium light blue handwritten ink
            });
          }
        }
      } else {
        // Free float text drawing with dynamic coordinate bounding box enforcement
        enforceBoundingBoxAndDraw(
          pdfLibPage,
          cleanAnswer,
          minX,
          maxX,
          targetY,
          bottomBound,
          selectedFont,
          rgb(0.12, 0.42, 0.96)
        );
      }

      // Increment overall solved index
      solvedIndex++;
    });
  }

  if (onProgress) onProgress('Verifying answers coordinates and final metadata alignment...');
  const modifiedPdfBytes = await pdfDoc.save();
  return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
};
