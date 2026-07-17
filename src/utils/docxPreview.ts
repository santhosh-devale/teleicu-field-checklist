import mammoth from 'mammoth';

export async function docxToHtml(blob: Blob): Promise<string> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Failed to convert docx to HTML:', error);
    return '<p>Unable to preview document</p>';
  }
}
