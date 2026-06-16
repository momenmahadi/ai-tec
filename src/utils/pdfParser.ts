/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses a PDF file using pdf.js from the browser's global scope
 * and extracts text content page by page up to a sensible limit to avoid token leaks.
 */
export const extractTextFromPdf = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
        
        // Retrieve pdfjsLib from global window scope (loaded via CDN in index.html)
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) {
          throw new Error('مكتبة PDF.js غير محملة بشكل صحيح. يرجى التحقق من اتصال الإنترنت.');
        }

        // Configure the worker pathway using the same CDN version
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        
        let extractedText = '';
        const totalPages = pdf.numPages;
        
        // Read up to 25 pages to avoid absolute memory blocks or context limits
        const targetPages = Math.min(totalPages, 25);

        for (let i = 1; i <= targetPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            
            extractedText += `--- الصفحة ${i} ---\n${pageText}\n\n`;
            
            if (onProgress) {
              onProgress(Math.round((i / targetPages) * 100));
            }
          } catch (pageError) {
            console.error(`Error parsing page ${i}:`, pageError);
          }
        }

        if (extractedText.trim() === '') {
          throw new Error('لم نتمكن من استخراج أي نص من ملف الـ PDF. قد يكون الملف عبارة عن صور ممسوحة ضوئياً (Scanned). يرجى تعبئة النص كتابياً أو استخدام ملف نصي.');
        }

        resolve(extractedText);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => {
      reject(new Error('فشلت قراءة الملف المحدد. يرجى المحاولة مرة أخرى.'));
    };

    fileReader.readAsArrayBuffer(file);
  });
};
