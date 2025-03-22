import mammoth from 'mammoth'

export class DocumentProcessor {
  /**
   * Process a document file and convert it to chapters structure
   * @param {Blob|File} file - The document file to process
   * @param {string} format - The format of the document ('docx', 'pdf', etc.)
   * @returns {Promise<Array>} - Promise resolving to an array of chapter objects
   */
  async processDocument(file, format = 'docx') {
    if (format === 'docx') {
      return this.processDocx(file)
    }

    throw new Error(`Unsupported document format: ${format}`)
  }

  /**
   * Process a DOCX file and convert it to chapter structure
   * @param {Blob|File} file - The DOCX file to process
   * @returns {Promise<Array>} - Promise resolving to an array of chapter objects
   */
  async processDocx(file) {
    try {
      // Convert DOCX to HTML using mammoth.js
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
      const htmlContent = result.value

      // Parse the HTML content into chapter structure
      return this.parseHtmlToChapters(htmlContent)
    } catch (error) {
      console.error('Error processing DOCX file:', error)
      throw error
    }
  }

  /**
   * Parse HTML content into chapter structure
   * @param {string} htmlContent - The HTML content to parse
   * @returns {Array} - Array of chapter objects
   */
  parseHtmlToChapters(htmlContent) {
    // Create a DOM parser to work with the HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    // For simplicity, we'll assume this is just a single chapter (chapter0)
    // You can expand this logic to handle multiple chapters if needed
    const chapterId = 0
    const chapterTitle = doc.querySelector('h1')?.textContent || 'Mental Math Basics'

    // Find all section headers (h2 elements)
    const sectionElements = doc.querySelectorAll('h2')
    const sections = []

    // Process each section
    Array.from(sectionElements).forEach((sectionHeader, index) => {
      const sectionId = `section-${index}`
      const sectionTitle = sectionHeader.textContent

      // Get all content until the next section header
      let sectionContent = '<div>'
      let currentElement = sectionHeader.nextElementSibling

      while (currentElement && currentElement.tagName !== 'H2') {
        sectionContent += currentElement.outerHTML
        currentElement = currentElement.nextElementSibling
      }

      sectionContent += '</div>'

      sections.push({
        id: sectionId,
        title: sectionTitle,
        content: sectionContent,
      })
    })

    // If no sections were found but there's content, create a default section
    if (sections.length === 0) {
      const bodyContent = doc.body.innerHTML
      sections.push({
        id: 'section-0',
        title: 'Introduction',
        content: `<div>${bodyContent}</div>`,
      })
    }

    // Create the chapter object
    const chapter = {
      id: chapterId,
      title: chapterTitle,
      sections: sections,
    }

    return [chapter] // Return as array of chapters
  }
}
