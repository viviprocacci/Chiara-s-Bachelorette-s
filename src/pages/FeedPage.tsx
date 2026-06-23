import { useTrip } from '@/context/TripContext'
import PageHeader from '@/components/layout/PageHeader'
import PostComposer from '@/components/feed/PostComposer'
import FeedPostCard from '@/components/feed/FeedPostCard'
import AnnouncementCard from '@/components/updates/AnnouncementCard'

export default function FeedPage() {
  const { feedPosts, announcements, postPhoto } = useTrip()

  const tripIntel = announcements.filter(
    (a) => a.announcement_type === 'schedule_change' || a.announcement_type === 'arrival',
  )

  return (
    <div className="page-container">
      <PageHeader title="The Feed" subtitle="Like, comment, and share from your camera roll" />

      <div className="scroll-content space-y-4">
        <PostComposer onPost={postPhoto} />

        {tripIntel.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
              Trip intel
            </p>
            {tripIntel.slice(0, 2).map((a, i) => (
              <AnnouncementCard key={a.id} announcement={a} index={i} compact />
            ))}
          </div>
        )}

        {feedPosts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-display text-lg text-[var(--palette-text-muted)]">No photos yet</p>
            <p className="mt-1 text-sm text-[var(--palette-text-muted)]">
              Be the first to drop a pic from the bach!
            </p>
          </div>
        ) : (
          feedPosts.map((post, i) => <FeedPostCard key={post.id} post={post} index={i} />)
        )}
      </div>
    </div>
  )
}
