const MAX_WIDTH = 1200
const JPEG_QUALITY = 0.82
const MAX_BYTES = 800_000

async function loadImageSource(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  try {
    const bitmap = await createImageBitmap(file)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    }
  } catch {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Could not load image'))
        image.src = objectUrl
      })
      return {
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      }
    } catch (err) {
      URL.revokeObjectURL(objectUrl)
      throw err
    }
  }
}

export async function compressImageForUpload(file: File): Promise<Blob> {
  const { source, width: sourceWidth, height: sourceHeight, cleanup } = await loadImageSource(file)
  const scale = Math.min(1, MAX_WIDTH / sourceWidth)
  const width = Math.round(sourceWidth * scale)
  const height = Math.round(sourceHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    cleanup()
    throw new Error('Could not process image')
  }

  ctx.drawImage(source, 0, 0, width, height)
  cleanup()

  let quality = JPEG_QUALITY
  let blob = await canvasToBlob(canvas, quality)

  while (blob.size > MAX_BYTES && quality > 0.4) {
    quality -= 0.1
    blob = await canvasToBlob(canvas, quality)
  }

  return blob
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not compress image'))),
      'image/jpeg',
      quality,
    )
  })
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(blob)
  })
}

export async function prepareImageForUpload(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  const blob = await compressImageForUpload(file)
  const dataUrl = await blobToDataUrl(blob)
  return { blob, dataUrl }
}
