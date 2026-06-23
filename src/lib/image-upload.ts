const MAX_WIDTH = 1200
const JPEG_QUALITY = 0.82
const MAX_BYTES = 800_000

export async function compressImageForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

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
