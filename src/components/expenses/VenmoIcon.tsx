export default function VenmoIcon({
  size = 20,
  className = 'text-[var(--palette-text-muted)]',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M16.8 6.5c-.3 2.1-1.5 4.8-2.7 6.9l-3.4-9.4H7.2l5.3 13.5c-.3.7-.8 1.8-1.3 2.6-.4.6-.9 1.1-1.5 1.1-.4 0-.8-.2-1.1-.5l-1.2-1.3 1.8-1.6.5.6.4-.9L5 6.5h3.5l2.8 7.6L14.5 6.5H16.8z"
      />
    </svg>
  )
}

function normalizeVenmoRecipient(recipient?: string): string | undefined {
  if (!recipient) return undefined
  const cleaned = recipient.replace(/^@+/, '').trim().toLowerCase()
  return cleaned || undefined
}

export function buildVenmoPayUrls(
  amountCents: number,
  note: string,
  recipient?: string,
): { appUrl: string; webUrl: string } {
  const amount = (amountCents / 100).toFixed(2)
  const cleanRecipient = normalizeVenmoRecipient(recipient)

  const appParams = new URLSearchParams({ txn: 'pay', amount, note })
  if (cleanRecipient) appParams.set('recipients', cleanRecipient)

  const webParams = new URLSearchParams({ txn: 'pay', amount, note })
  if (cleanRecipient) webParams.set('recipients', cleanRecipient)

  return {
    appUrl: `venmo://paycharge?${appParams.toString()}`,
    webUrl: `https://account.venmo.com/pay?${webParams.toString()}`,
  }
}

export function openVenmoPay(amountCents: number, note: string, recipient?: string): void {
  const { appUrl, webUrl } = buildVenmoPayUrls(amountCents, note, recipient)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  if (isMobile) {
    window.location.href = appUrl
    window.setTimeout(() => {
      window.location.href = webUrl
    }, 800)
  } else {
    window.open(webUrl, '_blank', 'noopener,noreferrer')
  }
}
