import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import type { FeedPost } from '@/types'
import { fireMiniSparkle } from '@/lib/confetti'

interface FeedPostCardProps {
  post: FeedPost
  index?: number
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function FeedPostCard({ post, index = 0 }: FeedPostCardProps) {
  const lastTap = useRef(0)

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      fireMiniSparkle()
    }
    lastTap.current = now
  }

  const name = post.poster?.display_name ?? 'Someone'
  const initial = name.charAt(0).toUpperCase()
  const color = post.poster?.avatar_color ?? 'var(--palette-accent)'

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="glass-card overflow-hidden"
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: color }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-[11px] text-[var(--palette-text-muted)]">{timeAgo(post.created_at)}</p>
        </div>
      </header>

      <div className="relative bg-black/5" onClick={handleDoubleTap}>
        <img
          src={post.image_url}
          alt={post.caption ?? 'Trip photo'}
          className="w-full object-cover"
          style={{ maxHeight: '420px' }}
          loading="lazy"
        />
      </div>

      <div className="space-y-2 px-4 py-3">
        <Heart size={18} className="text-[var(--palette-accent)]" strokeWidth={1.8} />
        {post.caption && (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{name}</span>{' '}
            <span className="text-[var(--palette-text)]">{post.caption}</span>
          </p>
        )}
      </div>
    </motion.article>
  )
}
