// Reply and new-thread textareas carry data-draft

/** True when a reply or new-thread textarea on the page has unsent text */
export function hasDraft(): boolean {
  return Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea[data-draft]")).some(
    (textarea) => textarea.value.trim() !== ""
  );
}
