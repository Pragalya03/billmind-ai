export function explainLowConfidence(item) {
  const text = item.text || ""
  const confidence = item.confidence ?? 0

  if (confidence < 0.3) {
    return "Very unclear handwriting or low image quality"
  }

  if (/[0O]/.test(text) || /[1Il]/.test(text)) {
    return "Characters look visually similar (e.g. O / 0, I / l)"
  }

  if (text.length <= 2) {
    return "Too few characters to be certain"
  }

  if (/[^a-zA-Z0-9]/.test(text)) {
    return "Unusual symbols or formatting detected"
  }

  return "Handwriting unclear or partially cut off"
}
