/** Triggers a browser download of text content. */
export function downloadText(
  filename: string,
  content: string,
  mime: string = 'application/json;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
