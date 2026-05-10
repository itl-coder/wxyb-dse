/**
 * Attachment handler composable — FileReader to base64 conversion
 * Used across AI Data Collection Center modules for file uploads.
 */
export function useAttachment() {
  function fileToBase64(file, maxSizeMB = 10) {
    return new Promise((resolve, reject) => {
      const maxBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxBytes) {
        reject(new Error(`文件大小超过 ${maxSizeMB}MB 限制`))
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  async function filesToBase64List(files) {
    const list = Array.isArray(files) ? files : Array.from(files)
    const results = []
    for (const f of list) {
      try {
        const dataUrl = await fileToBase64(f)
        results.push({ name: f.name, type: f.type, size: f.size, dataUrl })
      } catch { /* skip failed files */ }
    }
    return results
  }

  function validateFile(file, allowedTypes, maxSizeMB = 10) {
    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}，允许: ${allowedTypes.join(', ')}`
    }
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      return `文件过大: ${formatFileSize(file.size)}，限制 ${maxSizeMB}MB`
    }
    return null
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function isImage(dataUrl) {
    return /^data:image\//.test(dataUrl || '')
  }

  const ALL_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp']

  return { fileToBase64, filesToBase64List, validateFile, formatFileSize, isImage, ALL_IMAGE_TYPES }
}
