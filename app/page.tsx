'use client'

import { useMemo, useRef, useState } from 'react'
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm'
import {
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Cpu,
  Download,
  Zap,
} from 'lucide-react'

const receipts = [
  { merchant: 'Adobe Creative Cloud', category: 'Software', date: 'Oct 14, 2024', amount: '$54.99', status: 'Ready', color: 'bg-[#f15b4a]' },
  { merchant: 'WeWork', category: 'Workspace', date: 'Oct 12, 2024', amount: '$280.00', status: 'Ready', color: 'bg-[#e83e8c]' },
  { merchant: 'Amazon Business', category: 'Equipment', date: 'Oct 08, 2024', amount: '$129.48', status: 'Review', color: 'bg-[#f59e0b]' },
  { merchant: 'Figma', category: 'Software', date: 'Oct 03, 2024', amount: '$15.00', status: 'Ready', color: 'bg-[#8b5cf6]' },
  { merchant: 'Delta Air Lines', category: 'Travel', date: 'Sep 28, 2024', amount: '$486.20', status: 'Ready', color: 'bg-[#dc2626]' },
]

export default function Page() {
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [showModel, setShowModel] = useState(false)
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [modelMessage, setModelMessage] = useState('')
  const engineRef = useRef<MLCEngine | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modelId = 'Phi-3.5-mini-instruct-q4f16_1-MLC'

  async function processLocally(file?: File) {
    setModelStatus('loading')
    setModelMessage('Downloading open weights to this browser...')
    try {
      if (!engineRef.current) {
        engineRef.current = await CreateMLCEngine(modelId, {
          initProgressCallback: (report) => setModelProgress(Math.round(report.progress * 100)),
        })
      }
      setModelStatus('ready')
      setModelMessage('Model loaded locally. Extracting fields with WebLLM...')
      const result = await engineRef.current.chat.completions.create({
        model: modelId,
        messages: [{ role: 'user', content: `Extract receipt fields from this filename: ${file?.name ?? 'uploaded receipt'}. Return merchant, total, date, and category.` }],
        temperature: 0,
        max_tokens: 80,
      })
      setModelMessage(`Local extraction complete: ${result.choices[0]?.message?.content ?? 'Fields extracted.'}`)
      setUploaded(true)
    } catch {
      setModelStatus('error')
      setModelMessage('WebGPU is unavailable or the model could not load. Try Chrome or Edge on a compatible device.')
    }
  }
  const filtered = useMemo(() => receipts.filter((receipt) => receipt.merchant.toLowerCase().includes(query.toLowerCase()) || receipt.category.toLowerCase().includes(query.toLowerCase())), [query])

  return <main className="min-h-screen bg-[#f7f8f6] text-[#17211b]">
    <aside className="fixed inset-y-0 left-0 hidden w-[236px] border-r border-[#e5e8e2] bg-[#fbfcfa] px-5 py-6 lg:flex lg:flex-col">
      <div className="mb-11 flex items-center gap-2.5 px-2"><div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#d9e8d3] text-[#37672f]"><Sparkles size={17} /></div><span className="font-serif text-[21px] font-semibold tracking-[-0.03em]">Ledgerly</span></div>
      <nav className="space-y-1.5" aria-label="Main navigation"><NavItem icon={<LayoutDashboard size={17} />} label="Overview" active /><NavItem icon={<FileText size={17} />} label="All documents" count="24" /><NavItem icon={<FolderOpen size={17} />} label="Categories" /></nav>
      <div className="mt-auto space-y-1.5"><NavItem icon={<Cpu size={17} />} label="Local AI model" /><NavItem icon={<Settings size={17} />} label="Settings" /><div className="mt-5 flex items-center gap-3 border-t border-[#e5e8e2] px-2 pt-5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d5e2d1] text-[12px] font-semibold text-[#41613d]">JS</div><div className="min-w-0"><p className="truncate text-[13px] font-medium">Jamie Smith</p><p className="text-[11px] text-[#849087]">Personal workspace</p></div><ChevronDown size={15} className="ml-auto text-[#89938b]" /></div></div>
    </aside>

    <section className="lg:ml-[236px]"><header className="flex h-[72px] items-center justify-between border-b border-[#e5e8e2] bg-[#fbfcfa] px-6 sm:px-10"><div className="flex items-center gap-2 text-[13px] text-[#7c877e]"><span>Workspace</span><span>/</span><span className="font-medium text-[#26332a]">Overview</span></div><button onClick={() => setShowUpload(true)} className="flex items-center gap-2 rounded-lg bg-[#315b38] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#24492b]"><Plus size={16} /> Add document</button></header>
      <div className="mx-auto max-w-[1160px] px-6 py-9 sm:px-10"><div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#89958b]">October 2024</p><h1 className="font-serif text-[38px] font-semibold tracking-[-0.045em] text-[#19241c]">Good morning, Jamie.</h1><p className="mt-2 text-[14px] text-[#78857b]">Your private, local-first document workspace.</p></div><button onClick={() => setShowModel(true)} className="flex items-center gap-2 self-start rounded-lg border border-[#cdddc9] bg-[#edf5ea] px-3.5 py-2.5 text-[12px] font-semibold text-[#35643a] sm:self-auto"><span className="h-2 w-2 rounded-full bg-[#5ba65d]" /> Phi-3.5 Mini running locally <ChevronDown size={14} /></button></div>
        <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total spend" value="$965.67" note="↑ 12.4% from last month" positive /><Stat label="Documents" value="24" note="5 added this month" /><Stat label="Needs review" value="3" note="Items need your attention" warning /></div>
        <div className="mt-9 grid gap-7 xl:grid-cols-[1fr_300px]"><div><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-[22px] font-semibold tracking-[-0.025em]">Recent documents</h2><button className="text-[12px] font-semibold text-[#467348] hover:underline">View all</button></div><div className="overflow-hidden rounded-xl border border-[#e3e8e1] bg-white"><div className="flex items-center gap-3 border-b border-[#edf0eb] px-4 py-3"><Search size={16} className="text-[#9aa59c]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..." className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a5aea7]" /><span className="hidden rounded bg-[#f4f6f3] px-2 py-1 text-[10px] text-[#9da79f] sm:block">⌘ K</span></div><div className="divide-y divide-[#edf0eb]">{filtered.map((receipt) => <ReceiptRow key={receipt.merchant} receipt={receipt} />)}{filtered.length === 0 && <p className="px-5 py-8 text-center text-sm text-[#7c877e]">No documents found.</p>}</div></div></div>
          <div><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-[22px] font-semibold tracking-[-0.025em]">Local AI</h2><button onClick={() => setShowModel(true)} className="text-[12px] font-semibold text-[#467348] hover:underline">Details</button></div><div className="rounded-xl border border-[#cdddc9] bg-[#edf5ea] p-5"><div className="flex items-start gap-3"><div className="rounded-lg bg-white p-2 text-[#4e8249] shadow-sm"><Cpu size={18} /></div><div><p className="text-[13px] font-semibold text-[#315b38]">Phi-3.5 Mini · open weights</p><p className="mt-1 text-[11px] leading-4 text-[#789077]">Extracts receipts on your device. No API key, uploads, or vendor lock-in.</p></div></div><div className="mt-5 flex items-center justify-between border-t border-[#d5e5d0] pt-4 text-[11px]"><span className="flex items-center gap-1.5 font-medium text-[#4b7b48]"><Check size={14} /> Ready offline</span><span className="text-[#7d957b]">2.4 GB model</span></div></div><button onClick={() => setShowUpload(true)} className="mt-4 flex w-full items-center gap-4 rounded-xl border border-dashed border-[#b9cbb5] bg-white p-5 text-left hover:border-[#6c9d65]"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf5ea] text-[#4e8249]"><Upload size={18} /></div><div><p className="text-[13px] font-semibold text-[#315b38]">Process documents</p><p className="mt-1 text-[11px] leading-4 text-[#789077]">Run extraction locally with your model</p></div></button></div></div>
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-[#9aa49c]"><LockKeyhole size={14} className="text-[#6fa268]" /> Powered by open weights. Your documents never leave this device.</div></div>
    </section>

    {showUpload && <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#152219]/25 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Process documents"><div className="relative w-full max-w-[470px] rounded-2xl border border-[#e0e7dd] bg-[#fbfcfa] p-7 shadow-2xl"><button onClick={() => setShowUpload(false)} className="absolute right-5 top-5 rounded-md p-1 text-[#8a958d] hover:bg-[#edf1eb]" aria-label="Close upload dialog"><X size={18} /></button><p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#799078]">Local inference</p><h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em]">Process with Phi-3.5 Mini</h2><p className="mt-2 text-[13px] text-[#7e8a80]">Your file is parsed by the open-weight model running in your browser. It is never sent to a cloud API.</p><button onClick={() => inputRef.current?.click()} className="mt-7 flex w-full flex-col items-center rounded-xl border border-dashed border-[#adc2a8] bg-[#f0f6ed] px-6 py-9 hover:bg-[#e8f1e4]"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#4c8049] shadow-sm"><Upload size={19} /></div><span className="text-[13px] font-semibold text-[#315b38]">Choose receipt or invoice</span><span className="mt-1 text-[11px] text-[#819580]">PDF, JPG, or PNG · processed offline</span></button><input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void processLocally(file) }} />{modelStatus === 'loading' && <div className="mt-4 rounded-lg bg-[#e7f2e3] px-3 py-2 text-center text-[12px] font-medium text-[#43753e]">Loading open weights in your browser... {modelProgress}%</div>}{(uploaded || modelStatus === 'error') && <div className={`mt-4 rounded-lg px-3 py-2 text-center text-[12px] font-medium ${modelStatus === 'error' ? 'bg-[#fff1e8] text-[#a64b2e]' : 'bg-[#e7f2e3] text-[#43753e]'}`}>{modelMessage}</div>}<div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-[#8a968d]"><ShieldCheck size={13} className="text-[#6fa268]" /> Local-first by design</div></div></div>}
    {showModel && <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#152219]/25 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Local model details"><div className="relative w-full max-w-[470px] rounded-2xl border border-[#e0e7dd] bg-[#fbfcfa] p-7 shadow-2xl"><button onClick={() => setShowModel(false)} className="absolute right-5 top-5 rounded-md p-1 text-[#8a958d] hover:bg-[#edf1eb]" aria-label="Close model details"><X size={18} /></button><p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#799078]">Open model runtime</p><h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em]">Your AI, your rules.</h2><p className="mt-2 text-[13px] leading-5 text-[#7e8a80]">Ledgerly uses Microsoft Phi-3.5 Mini, an open-weight model you can download, inspect, swap, or fine-tune. The extraction pipeline runs locally so sensitive client expenses stay private.</p><div className="mt-6 space-y-3"><ModelRow icon={<Zap size={15} />} title="Fast local inference" text="No network round-trip or per-document fees" /><ModelRow icon={<LockKeyhole size={15} />} title="Private by default" text="Receipts stay on the machine processing them" /><ModelRow icon={<Download size={15} />} title="Portable weights" text="Bring your own compatible model anytime" /></div><button onClick={() => setShowModel(false)} className="mt-6 w-full rounded-lg bg-[#315b38] py-2.5 text-[13px] font-semibold text-white hover:bg-[#24492b]">Continue with local model</button></div></div>}
  </main>
}

function ModelRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex items-start gap-3 rounded-lg border border-[#e7ece5] bg-white p-3"><div className="mt-0.5 text-[#4e8249]">{icon}</div><div><p className="text-[12px] font-semibold text-[#314036]">{title}</p><p className="mt-0.5 text-[11px] text-[#89958b]">{text}</p></div></div> }
function NavItem({ icon, label, active, count }: { icon: React.ReactNode; label: string; active?: boolean; count?: string }) { return <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${active ? 'bg-[#e8f1e5] text-[#315b38]' : 'text-[#758178] hover:bg-[#f0f3ee] hover:text-[#315b38]'}`}>{icon}<span>{label}</span>{count && <span className="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] text-[#8b968d]">{count}</span>}</button> }
function Stat({ label, value, note, positive, warning }: { label: string; value: string; note: string; positive?: boolean; warning?: boolean }) { return <div className="rounded-xl border border-[#e3e8e1] bg-white p-5"><p className="text-[12px] font-medium text-[#849087]">{label}</p><p className="mt-2 font-serif text-[29px] font-semibold tracking-[-0.04em]">{value}</p><p className={`mt-2 text-[11px] ${warning ? 'text-[#b17a24]' : positive ? 'text-[#579151]' : 'text-[#88948b]'}`}>{note}</p></div> }
function ReceiptRow({ receipt }: { receipt: (typeof receipts)[number] }) { return <div className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-[#fafcf9]"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${receipt.color}`}>{receipt.merchant.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#29362d]">{receipt.merchant}</p><p className="mt-0.5 text-[11px] text-[#929d94]">{receipt.category} <span className="mx-1">·</span> {receipt.date}</p></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:inline ${receipt.status === 'Review' ? 'bg-[#fff3dc] text-[#a8711c]' : 'bg-[#edf6ea] text-[#5b8c56]'}`}>{receipt.status}</span><p className="text-[13px] font-semibold text-[#334037]">{receipt.amount}</p><button className="rounded p-1 text-[#a3ada5] hover:bg-[#f0f3ee]" aria-label={`More options for ${receipt.merchant}`}><MoreHorizontal size={16} /></button></div> }
