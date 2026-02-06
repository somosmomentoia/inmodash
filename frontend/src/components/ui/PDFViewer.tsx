'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  zoom?: number
  rotation?: number
}

export function PDFViewer({ url, zoom = 100, rotation = 0 }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err)
    setError('Error al cargar el PDF')
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages))
  }

  const canGoPrev = pageNumber > 1
  const canGoNext = pageNumber < numPages

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%', 
      height: '100%',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Contenido del PDF */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        width: '100%',
      }}>
        {loading && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            color: '#6b7280'
          }}>
            <Loader2 size={32} className="animate-spin" />
            <span style={{ marginLeft: '8px' }}>Cargando PDF...</span>
          </div>
        )}
        
        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            color: '#ef4444',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <p>{error}</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none'
              }}
            >
              Abrir en nueva pestaña
            </a>
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={zoom / 100}
            rotate={rotation}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {/* Barra de navegación inferior */}
      {numPages > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '12px 24px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          width: '100%',
        }}>
          <button 
            onClick={goToPrevPage} 
            disabled={!canGoPrev}
            style={{
              padding: '8px 12px',
              backgroundColor: canGoPrev ? '#3b82f6' : '#e5e7eb',
              border: 'none',
              borderRadius: '6px',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              color: canGoPrev ? 'white' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
          <span style={{ 
            minWidth: '140px', 
            textAlign: 'center',
            fontWeight: 500,
            color: '#374151',
          }}>
            Página {pageNumber} de {numPages}
          </span>
          <button 
            onClick={goToNextPage} 
            disabled={!canGoNext}
            style={{
              padding: '8px 12px',
              backgroundColor: canGoNext ? '#3b82f6' : '#e5e7eb',
              border: 'none',
              borderRadius: '6px',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              color: canGoNext ? 'white' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Siguiente
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
