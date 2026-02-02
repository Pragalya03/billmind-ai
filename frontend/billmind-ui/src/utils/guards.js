export function hasValidItems(table) {
  if (!Array.isArray(table)) return false
  return table.some(
    (r) => r.quantity != null && r.unit_price != null
  )
}

export function safeText(value, fallback = "—") {
  if (value === null || value === undefined || value === "")
    return fallback
  return value
}
