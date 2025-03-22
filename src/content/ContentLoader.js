import { DocumentProcessor } from './processors/DocumentProcessor'

export class ContentLoader {
  constructor() {
    this.processor = new DocumentProcessor()
    this.chapters = []
  }

  async loadDocument(file, format = 'docx') {
    try {
      this.chapters = await this.processor.processDocument(file, format)
      return this.chapters
    } catch (error) {
      console.error('Error loading document:', error)
      throw error
    }
  }

  getChapter(id) {
    return this.chapters.find((chapter) => chapter.id === id)
  }

  getAllChapters() {
    return this.chapters
  }

  // This method merges exercise configurations with the processed chapters
  mergeExerciseConfig(exerciseConfigs) {
    this.chapters = this.chapters.map((chapter) => {
      const config = exerciseConfigs[chapter.id]
      if (config) {
        return {
          ...chapter,
          exercises: config,
        }
      }
      return chapter
    })
  }
}
