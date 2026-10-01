import type { BookFormat, Chapter } from '../types'
import { t } from './i18n'

export interface ParsedBook {
  title: string
  author: string
  genre: string
  description: string
  format: BookFormat
  chapters: Chapter[]
  cover: string | null
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function textToParagraphs(text: string): string {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n')
}

export function detectFormat(file: File): BookFormat | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.epub')) return 'epub'
  if (name.endsWith('.fb2') || name.endsWith('.fb2.zip')) return 'fb2'
  if (name.endsWith('.txt')) return 'txt'
  if (name.endsWith('.pdf')) return 'pdf'
  return null
}

export async function parseFile(file: File): Promise<ParsedBook> {
  const format = detectFormat(file)
  if (!format) throw new Error(t('Неподдерживаемый формат. Выберите EPUB, FB2, TXT или PDF.'))
  if (format === 'txt') return parseTxt(file)
  if (format === 'fb2') return parseFb2(file)
  if (format === 'epub') return parseEpub(file)
  return parsePdf(file)
}

async function parseTxt(file: File): Promise<ParsedBook> {
  const buf = await file.arrayBuffer()
  let text = new TextDecoder('utf-8').decode(buf)
  // fallback for windows-1251 encoded files
  if (text.includes('\uFFFD')) text = new TextDecoder('windows-1251').decode(buf)
  const clean = text.replace(/\r\n/g, '\n').trim()
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean)
  const title = lines[0]?.slice(0, 120) || file.name.replace(/\.txt$/i, '')
  const author = /^(.+?)\s+[—-]\s+/.exec(lines[1] || '')?.[1] || t('Неизвестный автор')
  return {
    title,
    author,
    genre: '',
    description: '',
    format: 'txt',
    cover: null,
    chapters: [{ title, html: textToParagraphs(clean) }],
  }
}

async function parseFb2(file: File): Promise<ParsedBook> {
  const xml = await file.text()
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const bin = (t: string) => doc.getElementsByTagName(t)
  const title = bin('book-title')?.[0]?.textContent?.trim() || file.name
  const authorNode = bin('author')?.[0]
  const author = authorNode
    ? [authorNode.getElementsByTagName('last-name')[0]?.textContent, authorNode.getElementsByTagName('first-name')[0]?.textContent]
        .filter(Boolean)
        .reverse()
        .join(' ') || bin('nickname')?.[0]?.textContent || t('Неизвестный автор')
    : t('Неизвестный автор')
  const genre = bin('genre-code')?.[0]?.textContent?.trim() || ''
  const description = bin('annotation')?.[0]?.textContent?.trim().slice(0, 600) || ''

  let cover: string | null = null
  const coverpage = bin('coverpage')[0] as Element | undefined
  const coverHref = coverpage?.getElementsByTagName('image')[0]?.getAttribute('xlink:href') || coverpage?.getElementsByTagName('image')[0]?.getAttribute('href')
  if (coverHref) {
    const id = coverHref.replace('#', '')
    // getElementById в XML-документе не работает (в DTD нет объявления ID), поэтому бинарник
    // ищем перебором <binary>: так обложку находят и файлы, где id не совпадает с тегом
    const el = Array.from(bin('binary')).find((b) => (b as Element).getAttribute('id') === id)
    const data = el?.textContent?.replace(/\s/g, '')
    const ctype = el?.getAttribute('content-type') || 'image/jpeg'
    if (data) cover = `data:${ctype};base64,${data}`
  }

  const chapters: Chapter[] = []
  for (const sec of Array.from(bin('section'))) {
    const titleEl = (sec as Element).getElementsByTagName('title')[0]
    const secTitle = titleEl?.textContent?.trim().replace(/\s+/g, ' ') || t('Глава {n}', { n: chapters.length + 1 })
    const parts: string[] = []
    for (const child of Array.from(sec.children)) {
      if (['title', 'empty-line'].includes(child.tagName)) continue
      if (child.tagName === 'p') parts.push(`<p>${child.innerHTML}</p>`)
      else if (child.tagName === 'text-author') parts.push(`<p><em>${child.innerHTML}</em></p>`)
      else if (['cite', 'poem', 'epigraph'].includes(child.tagName)) parts.push(`<blockquote>${child.innerHTML}</blockquote>`)
    }
    if (parts.length) chapters.push({ title: secTitle, html: parts.join('\n') })
  }
  if (!chapters.length) chapters.push({ title, html: textToParagraphs(doc.documentElement.textContent || '') })
  return { title, author, genre, description, format: 'fb2', cover, chapters }
}

async function parseEpub(file: File): Promise<ParsedBook> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  const containerXml = await zip.file('META-INF/container.xml')?.async('string')
  const cDoc = new DOMParser().parseFromString(containerXml || '', 'application/xml')
  const opfPath = cDoc.querySelector('rootfile')?.getAttribute('full-path')
  if (!opfPath) throw new Error(t('EPUB повреждён: нет container.xml'))
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
  const opfXml = await zip.file(opfPath)?.async('string')
  const opf = new DOMParser().parseFromString(opfXml || '', 'application/xml')

  const DC = 'http://purl.org/dc/elements/1.1/'
  const meta = (local: string) => opf.getElementsByTagNameNS(DC, local)?.[0]?.textContent?.trim() || ''
  const title = meta('title') || file.name.replace(/\.epub$/i, '')
  const author = meta('creator') || t('Неизвестный автор')
  const description = meta('description').slice(0, 600)
  const genre = meta('subject')

  const manifest = new Map<string, { href: string; type: string }>()
  for (const item of Array.from(opf.querySelectorAll('manifest > item'))) {
    const el = item as Element
    manifest.set(el.getAttribute('id') || '', {
      href: opfDir + (el.getAttribute('href') || ''),
      type: el.getAttribute('media-type') || '',
    })
  }

  let cover: string | null = null
  const coverMeta = opf.querySelector('meta[name=cover]')?.getAttribute('content')
  const coverItem = coverMeta ? manifest.get(coverMeta) : Array.from(manifest.values()).find((m) => m.type.startsWith('image/') && /cover/i.test(m.href))
  if (coverItem) {
    const f = zip.file(coverItem.href)
    if (f) cover = 'data:' + coverItem.type + ';base64,' + (await f.async('base64'))
  }

  // linear="no" в spine — служебные страницы (титул, выходная): читатель через них не листает,
  // и главой титул становился потому, что <img> давал непустой innerHTML
  const spine = Array.from(opf.querySelectorAll('spine > itemref'))
    .filter((el) => (el as Element).getAttribute('linear') !== 'no')
    .map((el) => manifest.get((el as Element).getAttribute('idref') || ''))
    .filter(Boolean) as { href: string; type: string }[]

  const chapters: Chapter[] = []
  for (const item of spine) {
    const f = zip.file(item.href)
    if (!f) continue
    const xhtml = await f.async('string')
    const doc = new DOMParser().parseFromString(xhtml, 'application/xhtml+xml')
    const body = doc.body || new DOMParser().parseFromString(xhtml, 'text/html').body
    if (!body) continue
    const chTitle =
      doc.querySelector('h1, h2, h3')?.textContent?.trim().replace(/\s+/g, ' ') ||
      (doc.querySelector('title')?.textContent?.trim().replace(/\s+/g, ' ') ?? '')
    // strip scripts/styles, inline images to data urls
    body.querySelectorAll('script,style').forEach((el) => el.remove())
    for (const img of Array.from(body.querySelectorAll('img'))) {
      const src = img.getAttribute('src') || ''
      const res = zip.file(item.href.slice(0, item.href.lastIndexOf('/') + 1) + src.replace(/^\.\//, ''))
      if (res) img.setAttribute('src', 'data:image/' + (res.name.split('.').pop() || 'jpeg') + ';base64,' + (await res.async('base64')))
    }
    const html = body.innerHTML.trim()
    if (html) chapters.push({ title: chTitle || t('Глава {n}', { n: chapters.length + 1 }), html })
  }
  if (!chapters.length) throw new Error(t('В EPUB не найдено содержимое'))
  return { title, author, genre, description, format: 'epub', cover, chapters }
}

async function parsePdf(file: File): Promise<ParsedBook> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const meta = await doc.getMetadata().catch(() => null)
  const info = meta?.info as { Title?: string; Author?: string } | undefined

  const chapters: Chapter[] = []
  const outlineChapters: { title: string }[] = []
  const flatten = (items: unknown) => {
    if (!Array.isArray(items)) return
    for (const it of items as { title?: string; items?: unknown }[]) {
      if (it.title) outlineChapters.push({ title: it.title })
      if (it.items) flatten(it.items)
    }
  }
  try {
    const outline = await Promise.resolve((doc as unknown as { getOutline?: () => Promise<unknown> }).getOutline?.())
    flatten(outline)
  } catch {
    /* no outline */
  }

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((it: any) => it.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) chapters.push({ title: t('Страница {n}', { n: i }), html: `<p>${escapeHtml(text)}</p>` })
  }
  if (!chapters.length) throw new Error(t('Не удалось извлечь текст из PDF'))
  return {
    title: info?.Title?.trim() || file.name.replace(/\.pdf$/i, ''),
    author: info?.Author?.trim() || t('Неизвестный автор'),
    genre: '',
    description: '',
    format: 'pdf',
    cover: null,
    chapters,
  }
}
