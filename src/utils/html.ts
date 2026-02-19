/**
 * Returns true when the string contains HTML markup (as produced by the rich text editor).
 */
export const isHtmlContent = (text: string): boolean =>
  /<(p|div|h[1-6]|ul|ol|li|code|pre|blockquote|strong|em|s)[\s>]/i.test(text);

/**
 * Strips all HTML tags and collapses whitespace to a plain text string.
 * Useful for short preview snippets (e.g. line-clamp cards).
 */
export const stripHtmlTags = (text: string): string =>
  text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
