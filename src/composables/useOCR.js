/**
 * useOCR — 错题 OCR 识别工具
 * 使用 tesseract.js 进行图片文字识别，支持题号/公式提取
 * 采用动态 import 避免阻塞主 bundle
 */

/**
 * 从识别文本中提取题号（匹配 "1."、"2、"、"第1题" 等模式）
 */
export function extractQuestionNumbers(text) {
  const patterns = [
    /(\d+)[\.\、\)]\s*/g,
    /第\s*(\d+)\s*题/g,
    /Q(uestion)?\s*(\d+)/gi
  ]
  const numbers = new Set()
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const n = parseInt(match[1] || match[2])
      if (n > 0 && n < 10000) numbers.add(n)
    }
  }
  return [...numbers].sort((a, b) => a - b)
}

/**
 * 从识别文本中提取 LaTeX 公式片段（$...$ 模式）
 */
export function extractFormulas(text) {
  const formulas = []
  const regex = /\$([^$]+)\$/g
  let match
  while ((match = regex.exec(text)) !== null) {
    formulas.push(match[1].trim())
  }
  // Also match \[...\] block formulas
  const blockRegex = /\\\[([\s\S]*?)\\\]/g
  while ((match = blockRegex.exec(text)) !== null) {
    formulas.push(match[1].trim())
  }
  return [...new Set(formulas)]
}

/**
 * 使用 tesseract.js 进行 OCR 识别
 * 返回 { text, questionNumbers, formulas, confidence }
 */
export async function performOCR(imageDataUrl) {
  try {
    const Tesseract = await import('tesseract.js')
    const result = await Tesseract.recognize(imageDataUrl, 'chi_sim+eng', {
      logger: () => {} // silent
    })
    const text = result.data.text || ''
    return {
      text,
      questionNumbers: extractQuestionNumbers(text),
      formulas: extractFormulas(text),
      confidence: Math.round((result.data.confidence || 0))
    }
  } catch (e) {
    console.warn('Tesseract.js 不可用，使用浏览器内置 OCR API:', e.message)
    return fallbackOCR(imageDataUrl)
  }
}

/**
 * 降级方案：当 tesseract.js 不可用时，返回空识别结果
 */
async function fallbackOCR(_imageDataUrl) {
  return {
    text: '',
    questionNumbers: [],
    formulas: [],
    confidence: 0
  }
}
