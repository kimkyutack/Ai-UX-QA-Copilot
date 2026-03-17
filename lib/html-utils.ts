export function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function normalizeExtractedText(value: string) {
  return decodeHtml(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]{2,})([A-Z][a-z])/g, "$1 $2")
      .replace(/\s+/g, " "),
  ).trim();
}

export function cleanupText(value: string) {
  return normalizeExtractedText(value);
}

export function isSuspiciousCollapsedText(value: string) {
  const text = value.trim();

  if (text.length < 24) {
    return false;
  }

  const hasNoSpaces = !/\s/.test(text);
  const alphabeticRatio = (text.match(/[A-Za-z]/g)?.length ?? 0) / text.length;

  return hasNoSpaces && alphabeticRatio > 0.8;
}

export function dedupeStrings(values: string[], limit: number) {
  return values
    .map((value) => cleanupText(value))
    .filter(Boolean)
    .filter((value) => !isSuspiciousCollapsedText(value))
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, limit);
}
