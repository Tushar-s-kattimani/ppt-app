import HTMLtoDOCX from 'html-to-docx';
import fs from 'fs';

const documentHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            p, h1, h2, h3, h4, h5, h6, li, ul, ol, td, th {
              color: #000000;
              margin-bottom: 12px;
            }
          </style>
        </head>
        <body>
          <h1>Test</h1>
          <p>This is a test.</p>
        </body>
      </html>
    `;

async function test() {
    try {
        const fileBuffer = await HTMLtoDOCX(documentHTML, null, {
          font: 'Bookman Old Style',
          fontSize: 24,
        });
        fs.writeFileSync('test.docx', fileBuffer);
        console.log('Success, generated test.docx');
    } catch (e) {
        console.error('Failed:', e);
    }
}
test();
