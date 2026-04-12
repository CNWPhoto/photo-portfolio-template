// Render a heading string that may contain literal `\n` line breaks as <br/>.
// Escapes HTML entities so editor input can never inject markup. See spec §2.
export function renderHeading(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');
}
