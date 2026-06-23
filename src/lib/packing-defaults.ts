import type { PackingCategory } from '@/types'

export interface DefaultPackingItem {
  label: string
  category: PackingCategory
}

/** Starter group packing list — generic basics guests can edit, delete, and reorder. */
export const DEFAULT_PACKING_ITEMS: DefaultPackingItem[] = [
  { label: 'Weekend outfits', category: 'outfits' },
  { label: 'Swimsuit & cover-up', category: 'outfits' },
  { label: 'Comfortable shoes', category: 'outfits' },
  { label: 'Toiletries & skincare', category: 'toiletries' },
  { label: 'Sunscreen', category: 'toiletries' },
  { label: 'Phone charger', category: 'misc' },
  { label: 'Portable speaker', category: 'shared_gear' },
  { label: 'Snacks & water', category: 'misc' },
]
