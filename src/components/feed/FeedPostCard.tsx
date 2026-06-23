import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import type { FeedPost } from '@/types'
import { playSparkleSound } from '@/lib/feedback'

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
  const { member, isOrganizer, likePost, commentOnPost, removePost } = useTrip()
  const [comment, setComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [busy, setBusy] = useState(false)

  const name = post.poster?.display_name ?? 'Someone'
  const initial = name.charAt(0).toUpperCase()
  const color = post.poster?.avatar_color ?? 'var(--palette-accent)'
  const canDelete = member && (post.posted_by === member.id || isOrganizer)
  const likeCount = post.like_count ?? 0
  const comments = post.comments ?? []

  const handleLike = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (!post.liked_by_me) playSparkleSound()
      await likePost(post.id)
    } finally {
      setBusy(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || busy) return
    setBusy(true)
    try {
      await commentOnPost(post.id, comment)
      setComment('')
      setShowComments(true)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (busy || !canDelete) return
    if (!window.confirm('Delete this post?')) return
    setBusy(true)
    try {
      await removePost(post.id)
    } finally {
      setBusy(false)
    }
  }

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
        {canDelete && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={busy}
            className="rounded-lg p-2 text-red-500/70 transition-colors hover:bg-red-50/60 hover:text-red-600"
            aria-label="Delete post"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <div className="relative bg-black/5">
        <img
          src={post.image_url}
          alt={post.caption ?? 'Trip photo'}
          className="w-full object-cover"
          style={{ maxHeight: '420px' }}
          loading="lazy"
        />
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleLike()}
            disabled={busy}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <Heart
              size={20}
              className={post.liked_by_me ? 'fill-[var(--palette-accent)] text-[var(--palette-accent)]' : 'text-[var(--palette-text-muted)]'}
              strokeWidth={1.8}
            />
            {likeCount > 0 && (
              <span className={post.liked_by_me ? 'text-[var(--palette-accent)]' : 'text-[var(--palette-text-muted)]'}>
                {likeCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--palette-text-muted)]"
          >
            <MessageCircle size={20} strokeWidth={1.8} />
            {comments.length > 0 && <span>{comments.length}</span>}
          </button>
        </div>

        {post.caption && (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{name}</span>{' '}
            <span className="text-[var(--palette-text)]">{post.caption}</span>
          </p>
        )}

        {(showComments || comments.length > 0) && comments.length > 0 && (
          <div className="space-y-2 border-t border-white/40 pt-3">
            {comments.map((c) => (
              <p key={c.id} className="text-sm leading-relaxed">
                <span className="font-semibold">{c.author?.display_name ?? 'Guest'}</span>{' '}
                <span className="text-[var(--palette-text)]">{c.body}</span>
              </p>
            ))}
          </div>
        )}

        <form onSubmit={(e) => void handleComment(e)} className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-w-0 flex-1 rounded-xl border border-white/60 bg-white/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
          />
          <button
            type="submit"
            disabled={busy || !comment.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
            style={{ background: 'var(--palette-accent)' }}
            aria-label="Post comment"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </motion.article>
  )
}
