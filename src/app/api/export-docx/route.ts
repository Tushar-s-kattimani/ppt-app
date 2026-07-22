import { NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request: Request) {
  try {
    const { htmlContent, topic } = await request.json();

    if (!htmlContent) {
      return NextResponse.json({ error: 'No HTML content provided' }, { status: 400 });
    }

    // Clean up the HTML to prevent Word document corruption
    // html-to-docx fails if it encounters complex Tailwind classes or inline styles
    const cleanHtml = htmlContent
      .replace(/class="[^"]*"/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/id="[^"]*"/g, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '') // Remove SVGs
      .replace(/<img[^>]*>/gi, ''); // Remove images which often require canvas/native builds to be fully supported

    // Wrap the HTML content in proper structure for the parser
    // html-to-docx parses semantic HTML perfectly. Do not use <style> tags as they can corrupt the internal document.xml
    const documentHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          ${cleanHtml}
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

    const bufferData = Buffer.isBuffer(fileBuffer) 
      ? fileBuffer 
      : fileBuffer instanceof Blob 
        ? Buffer.from(await fileBuffer.arrayBuffer()) 
        : Buffer.from(fileBuffer as any);

    // Return the generated buffer as a downloadable DOCX file
    return new NextResponse(bufferData, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': bufferData.length.toString(),
      },
    });
  } catch (error) {
    console.error('DOCX Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
}
