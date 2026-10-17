'use client'

import { useMemo, useRef, useState } from 'react'
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm'
import { FileText, Home, Inbox, Library, LoaderCircle, LockKeyhole, Menu, MoreHorizontal, Play, Plus, Search, Settings, Sparkles, Upload, X, Zap } from 'lucide-react'

type Extracted = { merchant: string; total: string; date: string; category: string; confidence: string }
type Receipt = Extracted & { id: number; color: string; file: string }

const starterReceipts: Receipt[] = [
  { id: 1, merchant: 'Adobe Creative Cloud', total: '$54.99', date: 'Oct 14', category: 'Software', confidence: '98%', file: 'adobe-invoice.pdf', color: 'from-pink-500 to-orange-400' },
  { id: 2, merchant: 'WeWork', total: '$280.00', date: 'Oct 12', category: 'Workspace', confidence: '96%', file: 'wework-receipt.jpg', color: 'from-fuchsia-500 to-purple-500' },
  { id: 3, merchant: 'Amazon Business', total: '$129.48', date: 'Oct 08', category: 'Equipment', confidence: '81%', file: 'amazon-order.pdf', color: 'from-amber-400 to-orange-500' },
]
const modelId = 'Phi-3.5-mini-instruct-q4f16_1-MLC'

export default function Page() {
  const [receipts, setReceipts] = useState(starterReceipts)
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showModel, setShowModel] = useState(false)
  const [status, setStatus] = useState('Ready to process locally')
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastText, setLastText] = useState('')
  const engineRef = useRef<MLCEngine | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => receipts.filter((item) => `${item.merchant} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [receipts, query])

  async function extractPdf(file: File) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const data = new Uint8Array(await file.arrayBuffer())
    const pdf = await pdfjs.getDocument({ data }).promise
    let text = ''
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo)
      const content = await page.getTextContent()
      text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n'
    }
    return text.trim()
  }

  async function extractImage(file: File) {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')
    const result = await worker.recognize(file)
    await worker.terminate()
    return result.data.text.trim()
  }

  async function processFile(file: File) {
    setIsProcessing(true); setProgress(3); setStatus('Reading document on this device...')
    try {
      const text = file.type === 'application/pdf' ? await extractPdf(file) : await extractImage(file)
      setLastText(text || 'No readable text found; using the filename as a hint.')
      setProgress(42); setStatus('Sending extracted text to Phi locally...')
      if (!engineRef.current) {
        engineRef.current = await CreateMLCEngine(modelId, { initProgressCallback: (report) => setProgress(Math.max(42, Math.round(report.progress * 42) + 42)) })
      }
      if (!text.trim()) {
        throw new Error('No readable text was found. Use a sharp JPG/PNG of a receipt or a text-based PDF.')
      }

      const response = await engineRef.current.chat.completions.create({
        model: modelId,
        temperature: 0,
        max_tokens: 200,
        messages: [{ role: 'system', content: 'You extract accounting data from receipt or invoice text. Return ONLY one valid JSON object with exactly these keys: merchant, total, date, category, confidence. If this is not a receipt or invoice, set merchant to "NOT_A_RECEIPT". Use empty strings when unknown.' }, { role: 'user', content: `Filename: ${file.name}\nDocument text:\n${text.slice(0, 7000)}` }],
      })
      const raw = response.choices[0]?.message?.content ?? '{}'
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse((jsonMatch?.[0] ?? '{}').replace(/```json|```/g, '').trim()) as Partial<Extracted>
      if (parsed.merchant === 'NOT_A_RECEIPT') {
        throw new Error('This file does not look like a receipt or invoice. Upload a JPG, PNG, or text-based PDF containing merchant, date, items, or total.')
      }
      setReceipts((items) => [{ id: Date.now(), merchant: parsed.merchant || file.name, total: parsed.total || '—', date: parsed.date || 'Today', category: parsed.category || 'Uncategorized', confidence: parsed.confidence || '—', file: file.name, color: 'from-cyan-400 to-blue-500' }, ...items])
      setProgress(100); setStatus(`Extracted ${parsed.merchant || file.name} with Phi-3.5 Mini`)
    } catch (error) {
      console.log('[v0] Local extraction failed:', error)
      setStatus('Could not extract this file. Try a text-based PDF or clear image.')
    } finally { setIsProcessing(false) }
  }

  async function useSampleInvoice() {
    setStatus('Loading the built-in sample invoice...')
    const response = await fetch('/sample-invoice.png')
    const blob = await response.blob()
    await processFile(new File([blob], 'sample-invoice.png', { type: 'image/png' }))
  }

  return <main className="min-h-screen bg-[#090a0f] text-white">
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-[220px] border-r border-white/[.08] bg-[#0b0c12] px-5 py-6 lg:flex lg:flex-col">
      <div className="mb-10 flex items-center gap-2.5 px-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f04d8b] to-[#6d5dfc]"><Sparkles size={18} /></div><span className="text-xl font-bold tracking-tight">Ledgerly</span></div>
      <p className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Your workspace</p>
      <nav className="mt-3 space-y-1"><Nav icon={<Home size={17} />} label="Feed" active /><Nav icon={<Inbox size={17} />} label="Documents" count="24" /><Nav icon={<Library size={17} />} label="Collections" /></nav>
      <div className="mt-auto space-y-1"><Nav icon={<Zap size={17} />} label="Local AI" /><Nav icon={<Settings size={17} />} label="Settings" /><div className="mt-5 border-t border-white/[.08] pt-5"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-300 to-blue-600" /><div><p className="text-xs font-semibold">Jamie Smith</p><p className="text-[10px] text-white/40">Personal workspace</p></div></div></div></div>
    </aside>
    <section className="lg:ml-[220px]"><header className="sticky top-0 z-10 flex h-[70px] items-center justify-between border-b border-white/[.08] bg-[#090a0f]/90 px-5 backdrop-blur-xl sm:px-9"><div className="flex items-center gap-3"><button className="lg:hidden"><Menu size={20} /></button><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f04d8b]">Tuesday, October 15</p><h1 className="text-lg font-bold">Your money, in motion.</h1></div></div><div className="flex items-center gap-2"><button onClick={() => setShowModel(true)} className="hidden items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[11px] font-semibold text-cyan-200 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Phi local</button><button onClick={() => setShowUpload(true)} className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-xs font-bold text-black hover:bg-white/85"><Plus size={15} /> Add document</button></div></header>
      <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-9"><div className="mb-8 grid gap-4 xl:grid-cols-[1.35fr_1fr]"><div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#30204b] via-[#201b3c] to-[#11162c] p-7"><div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#f04d8b]/20 blur-3xl" /><p className="relative text-xs font-semibold text-white/55">OCTOBER SPEND</p><p className="relative mt-2 text-5xl font-black tracking-[-.06em]">$965<span className="text-2xl text-white/50">.67</span></p><p className="relative mt-4 text-xs text-emerald-300">↑ 12.4% <span className="text-white/45">from last month</span></p><div className="relative mt-7 flex items-end gap-1.5">{[34, 48, 40, 66, 53, 80, 62, 94, 71, 87, 73, 100].map((height, i) => <div key={i} className={`h-${height} flex-1 rounded-t-sm ${i === 11 ? 'bg-[#f04d8b]' : 'bg-white/15'}`} style={{ height: `${height * .42}px` }} />)}</div></div><div className="rounded-3xl border border-white/[.08] bg-[#111219] p-7"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-white/55">AI ACTIVITY</p><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">ON DEVICE</span></div><p className="mt-3 text-3xl font-black">24 <span className="text-sm font-medium text-white/45">documents sorted</span></p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-400 to-[#6d5dfc]" /></div><p className="mt-3 text-[11px] text-white/45">Phi-3.5 Mini · open weights · no cloud uploads</p></div></div>
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f04d8b]">The latest</p><h2 className="mt-1 text-2xl font-black tracking-tight">Your documents</h2></div><button className="text-xs font-semibold text-white/45 hover:text-white">See all</button></div><div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.04] px-4 py-3"><Search size={17} className="text-white/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your money..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" /></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/[.08] bg-[#111219] transition hover:-translate-y-1 hover:border-white/20"><div className={`relative h-28 bg-gradient-to-br ${item.color} p-4`}><FileText className="absolute right-4 top-4 text-white/60" size={20} /><div className="absolute bottom-3 left-4"><p className="max-w-[190px] truncate text-sm font-bold">{item.merchant}</p><p className="text-[11px] text-white/70">{item.file}</p></div></div><div className="p-4"><div className="flex items-center justify-between"><span className="rounded-full bg-white/[.08] px-2 py-1 text-[10px] font-bold text-white/60">{item.category}</span><button aria-label={`More options for ${item.merchant}`}><MoreHorizontal size={17} className="text-white/35" /></button></div><div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] text-white/35">TOTAL</p><p className="text-xl font-black">{item.total}</p></div><p className="text-right text-[11px] text-white/40">{item.date}<br /><span className="text-emerald-300">{item.confidence} confidence</span></p></div></div></article>)}<button onClick={() => setShowUpload(true)} className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[.02] text-white/45 transition hover:border-[#f04d8b]/60 hover:bg-[#f04d8b]/5"><div className="mb-3 rounded-full bg-white/[.08] p-3"><Plus size={20} /></div><span className="text-sm font-bold">Process a document</span><span className="mt-1 text-[11px]">PDF, JPG, or PNG</span></button></div><div className="mt-9 flex items-center justify-center gap-2 text-[11px] text-white/30"><LockKeyhole size={13} className="text-cyan-300" /> Built with open weights. Your financial data stays on your device.</div></div>
    </section>
    {showUpload && <Modal title="Process with Phi" close={() => setShowUpload(false)}><p className="text-sm leading-6 text-white/55">Client-side OCR and PDF text extraction happen first. Only the extracted text is passed to Phi-3.5 Mini running in this browser.</p><button onClick={() => fileRef.current?.click()} disabled={isProcessing} className="mt-6 flex w-full flex-col items-center rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-300/5 px-5 py-8 hover:bg-cyan-300/10 disabled:opacity-50"><Upload className="mb-3 text-cyan-300" size={24} /><span className="text-sm font-bold">Choose receipt or invoice</span><span className="mt-1 text-xs text-white/40">PDF, JPG, or PNG · never uploaded</span></button><button onClick={() => void useSampleInvoice()} disabled={isProcessing} className="mt-3 w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-xs font-semibold text-white/70 hover:bg-white/10 disabled:opacity-50">Try the built-in sample invoice</button><input ref={fileRef} className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const file = e.target.files?.[0]; if (file) void processFile(file) }} />{(isProcessing || lastText || status) && <div className="mt-5 rounded-xl bg-white/[.06] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-cyan-200">{isProcessing && <LoaderCircle size={14} className="animate-spin" />}{status}</div>{isProcessing && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div>}{lastText && <p className="mt-3 line-clamp-3 text-[10px] leading-4 text-white/35">OCR/PDF text: {lastText}</p>}</div>}</Modal>}
    {showModel && <Modal title="Open weights, not empty promises." close={() => setShowModel(false)}><p className="text-sm leading-6 text-white/55">Ledgerly uses Phi-3.5 Mini through WebLLM. The model weights download into the browser, extraction runs on-device, and structured JSON fields are parsed into your workspace. No API key or server inference is involved.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><Feature title="Private" text="No receipt upload" /><Feature title="Portable" text="Swap open models" /><Feature title="Affordable" text="No per-file fees" /></div></Modal>}
  </main>
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="relative w-full max-w-[500px] rounded-3xl border border-white/10 bg-[#15161e] p-7 shadow-2xl"><button onClick={close} className="absolute right-5 top-5 rounded-full p-2 text-white/45 hover:bg-white/10" aria-label="Close"><X size={17} /></button><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#f04d8b]"><Play size={13} /> Local inference</div><h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>{children}</div></div> }
function Feature({ title, text }: { title: string; text: string }) { return <div className="rounded-xl border border-white/[.08] bg-white/[.04] p-3"><p className="text-xs font-bold">{title}</p><p className="mt-1 text-[11px] text-white/40">{text}</p></div> }
function Nav({ icon, label, active, count }: { icon: React.ReactNode; label: string; active?: boolean; count?: string }) { return <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? 'bg-white/10 text-white' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>{icon}<span>{label}</span>{count && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{count}</span>}</button> }
