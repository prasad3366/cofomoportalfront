export function shortFileName(name: string | undefined | null, max = 48): string {
  if (!name) return '';
  let out = String(name);

  // If filename starts with a UUID-like prefix followed by underscore, strip it
  // e.g. <uuid>_original_filename.pdf
  const underscoreIndex = out.indexOf('_');
  if (underscoreIndex > 0) {
    const prefix = out.slice(0, underscoreIndex);
    if (/^[0-9a-fA-F-]{8,}$/.test(prefix)) {
      out = out.slice(underscoreIndex + 1);
    }
  }

  // If still long, truncate in the middle to preserve extension
  if (out.length > max) {
    const extIndex = out.lastIndexOf('.');
    const ext = extIndex > 0 ? out.slice(extIndex) : '';
    const baseMax = max - (ext.length + 3);
    if (baseMax > 8) {
      return out.slice(0, Math.floor(baseMax/2)) + '...' + out.slice(out.length - Math.ceil(baseMax/2)) + ext;
    }
    return out.slice(0, max-3) + '...';
  }

  return out;
}

export default shortFileName;
