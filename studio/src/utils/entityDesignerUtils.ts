// ============================================================
// Shared utilities for Entity Designer
// ============================================================

/**
 * Converts a human-readable label to a snake_case slug identifier.
 * "Vehicle Order" → "vehicle_order"
 * "GST Invoice #" → "gst_invoice_"  → then capped/trimmed
 */
export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50);
}
