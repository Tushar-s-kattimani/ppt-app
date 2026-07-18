import { NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request: Request) {
  try {
    const { htmlContent, topic } = await request.json();

    if (!htmlContent) {
      return NextResponse.json({ error: 'No HTML content provided' }, { status: 400 });
    }

    // Wrap the HTML content in proper structure for the parser
    // html-to-docx parses semantic HTML perfectly. Do not use <style> tags as they can corrupt the internal document.xml
    const documentHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Configure the DOCX generator (font size is in half-points, 24 = 12pt)
    const fileBuffer = await HTMLtoDOCX(documentHTML, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      font: 'Bookman Old Style',
      fontSize: 24,
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
    }) as any;

    const safeTopic = (topic || 'Report').replace(/[^a-zA-Z0-9 -]/g, '').trim().substring(0, 30) || 'Report';
    const filename = `${safeTopic}.docx`;

    // Strictly convert Node Buffer to a raw ArrayBuffer to prevent Next.js from accidentally serializing it as a UTF-8 string
    let arrayBuffer: ArrayBuffer;
    let contentLength: string;
    
    if (fileBuffer instanceof Blob) {
      arrayBuffer = await fileBuffer.arrayBuffer();
      contentLength = fileBuffer.size.toString();
    } else if (fileBuffer.buffer) {
      arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      contentLength = fileBuffer.length.toString();
    } else {
      arrayBuffer = fileBuffer;
      contentLength = fileBuffer.byteLength.toString();
    }

    // Return the generated buffer as a downloadable DOCX file
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': contentLength,
      },
    });
  } catch (error) {
    console.error('DOCX Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
}
