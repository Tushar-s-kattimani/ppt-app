import HTMLtoDOCX from 'html-to-docx';
import fs from 'fs';

const htmlContent = `
<h1>1. Executive Summary</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em>.</p>
<ul>
<li>Overview of the report</li>
<li>Purpose of the study</li>
</ul>
<table>
  <tr><td>Test</td></tr>
</table>
`;

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
          ${htmlContent}
        </body>
      </html>
    `;

async function test() {
    try {
        const fileBuffer = await HTMLtoDOCX(documentHTML, null, {
          font: 'Bookman Old Style',
          fontSize: 24,
        });
        fs.writeFileSync('test2.docx', fileBuffer);
        console.log('Success, generated test2.docx size:', fileBuffer.length);
    } catch (e) {
        console.error('Failed:', e);
    }
}
test();
