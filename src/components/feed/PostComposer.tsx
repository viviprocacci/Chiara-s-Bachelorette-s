import { useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, Loader2, Images } from 'lucide-react'
import { prepareImageForUpload } from '@/lib/image-upload'

interface PostComposerProps {
  onPost: (file: File, caption: string) => Promise<void>
}

function isLikelyImage(file: File) {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name)
}

export default function PostComposer({ onPost }: PostComposerProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!isLikelyImage(file)) {
      setError('Please choose a photo')
      return
    }
    setError('')
    try {
      const { dataUrl } = await prepareImageForUpload(file)
      setPreview(dataUrl)
      setSelectedFile(file)
    } catch {
      setError('Could not load that photo')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    setPosting(true)
    setError('')
    try {
      await onPost(selectedFile, caption.trim())
      setPreview(null)
      setSelectedFile(null)
      setCaption('')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post — try again')
    } finally {
      setPosting(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="glass-card space-y-3 p-4">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      {!preview ? (
        <label
          htmlFor={inputId}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--palette-accent-light)] bg-white/30 py-8 text-sm font-medium text-[var(--palette-text-muted)] transition-colors hover:border-[var(--palette-accent)] hover:text-[var(--palette-accent)]"
        >
          <Images size={22} />
          Choose from camera roll
        </label>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl">
            <img src={preview} alt="Preview" className="max-h-72 w-full object-cover" />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
            >
              Change
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            rows={2}
            className="w-full resize-none rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
          />
          <motion.button
            type="submit"
            disabled={posting}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            {posting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Posting...
              </>
            ) : (
              <>
                <ImagePlus size={18} /> Post to feed
              </>
            )}
          </motion.button>
        </div>
      )}

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </form>
  )
}
