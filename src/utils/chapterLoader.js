/**
 * Utility for dynamically loading chapter images
 */

// Use Vite's import.meta.glob to dynamically import all PNG files
const chapterImages = import.meta.glob('@/data/chapter*/chapter*_*.png', { eager: true })

/**
 * Gets all image pages for a specific chapter
 * @param {number} chapterId - The chapter ID
 * @returns {Array} - Array of page objects with id and image path
 */
export function getChapterPages(chapterId) {
  const chapterPrefix = `chapter${chapterId}_`

  // Filter images for the specific chapter
  const chapterPaths = Object.keys(chapterImages)
    .filter((path) => path.includes(`/chapter${chapterId}/`) && path.includes(chapterPrefix))
    .map((path) => {
      // Extract the page number from the filename (e.g., chapter0_5.png -> 5)
      const filename = path.split('/').pop()
      const pageNumber = parseInt(filename.split('_')[1].split('.')[0])

      return {
        id: pageNumber,
        image: filename,
        path: path,
      }
    })
    .sort((a, b) => a.id - b.id) // Sort by page number

  return chapterPaths
}

/**
 * Converts a virtual path to a URL that can be used in src attributes
 * @param {string} path - The virtual path to the image
 * @returns {string} - The URL for the image
 */
export function getImageUrl(path) {
  return chapterImages[path].default
}
