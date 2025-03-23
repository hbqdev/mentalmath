<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  pdfUrl: {
    type: String,
    required: true,
  },
})

const pdfContainer = ref(null)
let pdfDoc = null
let pageNum = 1
let pageRendering = false
let pageNumPending = null
let scale = 1.5

onMounted(async () => {
  // Load PDF.js
  const pdfjsLib = window['pdfjs-dist/build/pdf']
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  try {
    // Load the PDF document
    pdfDoc = await pdfjsLib.getDocument(props.pdfUrl).promise
    renderPage(pageNum)
  } catch (error) {
    console.error('Error loading PDF:', error)
  }
})

onBeforeUnmount(() => {
  if (pdfDoc) {
    pdfDoc.destroy()
  }
})

async function renderPage(num) {
  pageRendering = true

  try {
    const page = await pdfDoc.getPage(num)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    }

    const renderTask = page.render(renderContext)
    await renderTask.promise

    pageRendering = false
    if (pageNumPending !== null) {
      renderPage(pageNumPending)
      pageNumPending = null
    }

    // Clear previous content and append new canvas
    if (pdfContainer.value) {
      pdfContainer.value.innerHTML = ''
      pdfContainer.value.appendChild(canvas)
    }
  } catch (error) {
    console.error('Error rendering page:', error)
    pageRendering = false
  }
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num
  } else {
    renderPage(num)
  }
}

function onPrevPage() {
  if (pageNum <= 1) {
    return
  }
  pageNum--
  queueRenderPage(pageNum)
}

function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return
  }
  pageNum++
  queueRenderPage(pageNum)
}
</script>

<template>
  <div class="pdf-viewer">
    <div class="pdf-controls">
      <button @click="onPrevPage" :disabled="pageNum <= 1">Previous</button>
      <span>Page {{ pageNum }} of {{ pdfDoc?.numPages || '?' }}</span>
      <button @click="onNextPage" :disabled="!pdfDoc || pageNum >= pdfDoc.numPages">Next</button>
    </div>
    <div ref="pdfContainer" class="pdf-container"></div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.pdf-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background-color: #f5f5f5;
  width: 100%;
  justify-content: center;
}

.pdf-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.pdf-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background-color: #f9f9f9;
  min-height: calc(100vh - 200px);
}

.pdf-container canvas {
  max-width: 100%;
  height: auto;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
