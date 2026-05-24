const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function useMediaUrl() {
  function mediaSrc(url: string | undefined | null): string {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return apiBase + url
  }

  function fullUrl(path: string): string {
    if (path.startsWith('http')) return path
    return apiBase + path
  }

  return { mediaSrc, fullUrl, apiBase }
}
