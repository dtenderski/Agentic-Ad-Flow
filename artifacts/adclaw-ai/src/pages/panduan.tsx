import * as React from "react"
import { Shell } from "@/components/layout/Shell"
import { BookOpen, Briefcase, Server, FileText, Target, CheckCircle, Bot, Database, ChevronRight, AlertCircle, Lightbulb, Zap, ArrowRight } from "lucide-react"

interface StepProps {
  number: number
  title: string
  description: string
  tips?: string[]
}

function Step({ number, title, description, tips }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="space-y-1 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {tips && tips.length > 0 && (
          <ul className="mt-2 space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

interface SectionProps {
  icon: React.ElementType
  title: string
  subtitle: string
  children: React.ReactNode
}

function Section({ icon: Icon, title, subtitle, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-border bg-secondary/30">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-foreground text-base">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  )
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "info" }) {
  const styles = {
    default: "bg-secondary text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}

function Callout({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
  const config = {
    tip: { icon: Lightbulb, bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Tips" },
    warning: { icon: AlertCircle, bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-400", label: "Perhatian" },
    info: { icon: Zap, bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", label: "Info" },
  }
  const { icon: Icon, bg, text, label } = config[type]
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${bg}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${text}`} />
      <div className={`text-sm leading-relaxed ${text}`}>
        <span className="font-semibold">{label}: </span>
        {children}
      </div>
    </div>
  )
}

export default function Panduan() {
  return (
    <Shell>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          <span>Dokumentasi</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Panduan Penggunaan AdClaw AI</h1>
        <p className="text-muted-foreground max-w-2xl">
          Panduan lengkap dari setup awal sampai kampanye berjalan di Meta Ads. Ikuti urutan langkah berikut untuk hasil terbaik.
        </p>
      </div>

      {/* Quick Flow */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Alur Kerja Utama</p>
        <div className="flex items-center flex-wrap gap-2 text-sm">
          {[
            { label: "1. Tambah Bisnis", color: "text-primary" },
            { label: "2. Tambah Produk", color: "text-primary" },
            { label: "3. Jalankan Pipeline", color: "text-primary" },
            { label: "4. Review Blueprint", color: "text-primary" },
            { label: "5. Human Gate", color: "text-primary" },
            { label: "6. Kampanye Live", color: "text-emerald-400" },
          ].map((item, i, arr) => (
            <React.Fragment key={i}>
              <span className={`font-medium ${item.color}`}>{item.label}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Section 1: Dashboard */}
      <Section icon={BookOpen} title="Dashboard — Command Center" subtitle="Halaman utama ringkasan performa">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dashboard menampilkan kondisi keseluruhan akun Anda secara real-time.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Conversion Readiness", desc: "Rata-rata skor blueprint aktif (0–100)" },
            { label: "Active Campaigns", desc: "Kampanye yang sedang berjalan" },
            { label: "Pipeline Runs", desc: "Eksekusi AI hari ini" },
            { label: "Pending Approvals", desc: "Blueprint menunggu persetujuan" },
          ].map((card) => (
            <div key={card.label} className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs font-semibold text-primary">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
        <Callout type="tip">
          Klik tombol <strong>Launch Pipeline</strong> di pojok kanan atas Dashboard untuk memulai kampanye baru dengan cepat.
        </Callout>
      </Section>

      {/* Section 2: Businesses */}
      <Section icon={Briefcase} title="Businesses — Data Bisnis" subtitle="Langkah pertama sebelum membuat kampanye">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Setiap kampanye membutuhkan profil bisnis. Profil ini digunakan AI untuk memahami konteks, brand voice, dan target pasar.
        </p>
        <div className="space-y-4">
          <Step
            number={1}
            title="Buka menu Businesses → klik + New Business"
            description="Isi formulir profil bisnis dengan lengkap. Semakin detail, semakin akurat blueprint yang dihasilkan AI."
            tips={[
              "Business Name: nama bisnis resmi",
              "Industry: pilih sektor yang paling relevan",
              "Target Market: deskripsikan pelanggan ideal (usia, pekerjaan, masalah yang dihadapi)",
              "Value Proposition: apa yang membuat bisnis Anda berbeda dari kompetitor",
              "Brand Voice: pilih tone — Professional, Friendly, Bold, atau Inspirational",
              "Compliance Notes: catatan khusus untuk policy iklan (opsional)",
            ]}
          />
          <Step
            number={2}
            title="Tambah Produk ke dalam Bisnis"
            description="Setelah bisnis tersimpan, buka detail bisnis dan klik Add Product. Satu bisnis bisa punya banyak produk."
            tips={[
              "Product Name: nama produk/layanan spesifik",
              "Price: harga jual (contoh: Rp 299.000)",
              "Key Benefit: manfaat utama yang dirasakan pelanggan",
              "Pain Point: masalah apa yang diselesaikan produk ini",
              "Landing Page URL: halaman tujuan iklan",
            ]}
          />
        </div>
        <Callout type="info">
          Data bisnis dan produk disimpan sebagai <strong>Agent Memory</strong> — AI akan belajar dari setiap kampanye dan semakin akurat dari waktu ke waktu.
        </Callout>
      </Section>

      {/* Section 3: Pipeline */}
      <Section icon={Server} title="Pipelines — Mesin AI" subtitle="Tempat MultiClaw + OpenClaw bekerja menghasilkan blueprint">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pipeline adalah eksekusi agen AI — 7 agen spesialis bekerja secara berurutan untuk menganalisis bisnis, riset audience, merancang kreatif, dan membuat rencana anggaran.
        </p>
        <div className="space-y-4">
          <Step
            number={1}
            title="Buka Pipelines → klik Launch Pipeline"
            description="Pilih bisnis dan produk yang sudah didaftarkan, lalu isi parameter kampanye."
            tips={[
              "Business: pilih bisnis yang sudah dibuat",
              "Product: pilih produk yang akan diiklankan",
              "Campaign Goal: SALES (penjualan), LEADS (prospek), TRAFFIC (kunjungan), AWARENESS (kesadaran merek)",
              "Daily Budget: anggaran harian dalam IDR (contoh: 100000 untuk Rp 100 ribu)",
              "Target Location: kota/provinsi target (contoh: Jakarta, Surabaya, atau Indonesia)",
              "Additional Context: instruksi tambahan untuk AI (opsional)",
            ]}
          />
          <Step
            number={2}
            title="Pantau eksekusi pipeline secara real-time"
            description="Halaman detail pipeline menampilkan log terminal langsung — lihat 7 agen bekerja satu per satu."
            tips={[
              "Business Claw: diagnosa bisnis dan posisi kompetitif",
              "Audience Claw: riset segmen dan targeting Meta",
              "Offer Claw: rekayasa penawaran dan mekanisme urgensi",
              "Campaign Claw: strategi kampanye dan objektif Meta",
              "Creative Claw: 3+ creative angle dengan copy lengkap",
              "Budget Claw: rencana anggaran dan KPI target",
              "Policy Claw: review risiko kebijakan Meta",
            ]}
          />
          <Step
            number={3}
            title="Klik View Generated Blueprint setelah selesai"
            description="Pipeline selesai dalam 1–3 menit. Blueprint lengkap siap untuk di-review."
          />
        </div>
        <Callout type="warning">
          Jangan tutup halaman pipeline saat masih berjalan — proses AI akan tetap berlanjut di server, tapi Anda tidak bisa melihat log real-time jika pindah halaman.
        </Callout>
      </Section>

      {/* Section 4: Blueprints */}
      <Section icon={FileText} title="Blueprints — Hasil Riset AI" subtitle="Dokumen strategi lengkap yang dihasilkan oleh 7 agen">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Blueprint adalah output utama AdClaw — dokumen strategi iklan yang komprehensif, siap untuk dieksekusi ke Meta Ads.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {[
            { label: "Business Context", desc: "Diagnosa bisnis, persona pembeli, hambatan konversi" },
            { label: "Campaign Strategy", desc: "Objective, buying type, conversion event" },
            { label: "Audience Plan", desc: "Cold, warm, hot audience + interests targeting" },
            { label: "Offer Strategy", desc: "Core offer, urgency, risk reversal, lead magnet" },
            { label: "Creative Blueprint", desc: "3+ angle kreatif dengan copy lengkap siap pakai" },
            { label: "Budget Plan", desc: "Testing phase, scaling trigger, pause rules, KPI target" },
            { label: "Policy Review", desc: "Risk score, checklist kebijakan Meta, rekomendasi" },
          ].map((item) => (
            <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
              <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <p className="text-sm font-semibold text-foreground mb-2">Skor Blueprint (0–100):</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Conversion Readiness — tinggi = siap convert</Badge>
            <Badge variant="info">Creative Strength — kekuatan materi kreatif</Badge>
            <Badge variant="info">Funnel Fit — kesesuaian funnel</Badge>
            <Badge variant="warning">Policy Risk — rendah = aman (100 = berbahaya)</Badge>
          </div>
        </div>
        <Callout type="tip">
          Copy dari Creative Blueprint langsung bisa digunakan di Facebook Ads Manager. Pilih angle yang paling relevan dengan target audience Anda.
        </Callout>
      </Section>

      {/* Section 5: Human Gate */}
      <Section icon={CheckCircle} title="Human Gate — Persetujuan Anda" subtitle="Gerbang otorisasi sebelum kampanye dikirim ke Meta">
        <p className="text-sm text-muted-foreground leading-relaxed">
          AdClaw tidak pernah mengirim kampanye tanpa persetujuan Anda. Human Gate adalah checkpoint wajib — di sinilah Anda memiliki kendali penuh.
        </p>
        <div className="space-y-4">
          <Step
            number={1}
            title="Buka menu Human Gate / Approvals"
            description="Semua blueprint yang sudah selesai dan belum disetujui akan muncul di sini."
          />
          <Step
            number={2}
            title="Periksa Interest Preview"
            description="Setiap blueprint menampilkan interest audience yang berhasil dicocokkan ke database Meta secara real-time."
            tips={[
              "Contoh: '5/7 interests matched' artinya 5 dari 7 interest yang direkomendasikan AI tersedia di Meta",
              "Jika 0 interests matched, tombol Approve akan diblokir — pipeline perlu dijalankan ulang",
              "Klik Inspect untuk melihat detail interest mana yang cocok dan mana yang tidak",
            ]}
          />
          <Step
            number={3}
            title="Pilih tindakan: Approve, Reject, atau Inspect"
            description="Klik Approve & Deploy untuk mengirim kampanye ke Meta (status PAUSED). Reject untuk membatalkan."
          />
        </div>
        <Callout type="info">
          Kampanye yang disetujui dikirim ke Meta dalam status <strong>PAUSED</strong> — Anda harus mengaktifkannya secara manual di halaman Campaign Detail atau di Meta Ads Manager. Ini adalah perlindungan ekstra agar tidak ada pengeluaran yang tidak disengaja.
        </Callout>
      </Section>

      {/* Section 6: Campaigns */}
      <Section icon={Target} title="Campaigns — Kelola Kampanye" subtitle="Monitoring dan manajemen kampanye live di semua platform">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Halaman Campaigns menampilkan semua kampanye — dari yang masih draft sampai yang sudah berjalan di Meta, Google, TikTok, atau LinkedIn.
        </p>
        <div className="space-y-4">
          <Step
            number={1}
            title="Lihat status dan performa setiap kampanye"
            description="Setiap kampanye menampilkan: platform, status, placement, dan budget harian."
          />
          <Step
            number={2}
            title="Buka detail kampanye untuk data performa lengkap"
            description="Halaman detail menampilkan metrik live langsung dari platform iklan."
            tips={[
              "Spend: total pengeluaran iklan",
              "Impressions: berapa kali iklan ditampilkan",
              "Clicks & CTR: klik dan click-through rate",
              "Leads: jumlah prospek yang masuk",
              "CPL: cost per lead (biaya per prospek)",
            ]}
          />
          <Step
            number={3}
            title="Push ke Platform / Pause / Aktifkan"
            description="Gunakan tombol di halaman detail untuk mengontrol kampanye langsung dari AdClaw — tanpa perlu buka Ads Manager."
            tips={[
              "Push to Platform: kirim kampanye yang belum di-push",
              "Pause Delivery: hentikan sementara kampanye yang aktif",
              "Activate Delivery: aktifkan kembali kampanye yang di-pause",
              "Open in Ads Manager: buka langsung di Meta Ads Manager",
            ]}
          />
        </div>
        <Callout type="tip">
          Anda bisa edit Ad Set (targeting, interests) langsung dari AdClaw tanpa perlu masuk ke Meta Ads Manager. Gunakan tombol <strong>Edit Ad Set</strong> di tabel Ad Sets.
        </Callout>
      </Section>

      {/* Section 7: Copilot */}
      <Section icon={Bot} title="Copilot — Asisten AI 24 Jam" subtitle="Chat AI untuk perintah, laporan, dan analisis performa">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Copilot adalah asisten AI yang memahami perintah dalam Bahasa Indonesia maupun Inggris. Gunakan untuk mengontrol kampanye, meminta laporan, dan mendapatkan analisis performa.
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Laporan Otomatis:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                <p className="text-xs font-semibold text-primary">📊 Morning Brief (06:00 WIB)</p>
                <p className="text-xs text-muted-foreground mt-1">Ringkasan performa kemarin, tren hari ini, 3 action item, dan quick win yang bisa dilakukan dalam 15 menit.</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                <p className="text-xs font-semibold text-primary">📈 Performance Report (16:00 WIB)</p>
                <p className="text-xs text-muted-foreground mt-1">Verdict kampanye hari ini, scorecard per kampanye (SCALE / HOLD / PAUSE / REFRESH), dan action items EOD.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Contoh Perintah:</p>
            <div className="space-y-2">
              {[
                { cmd: "\"Tampilkan semua kampanye aktif\"", desc: "List semua kampanye beserta status dan budget" },
                { cmd: "\"Berapa spend hari ini?\"", desc: "Ringkasan pengeluaran iklan hari ini" },
                { cmd: "\"Pause kampanye 3\"", desc: "Pause kampanye dengan ID 3 di AdClaw dan Meta sekaligus" },
                { cmd: "\"Naikkan budget kampanye 5 jadi 200000\"", desc: "Update budget kampanye ID 5 menjadi Rp 200 ribu" },
                { cmd: "\"Aktifkan kembali kampanye 2\"", desc: "Resume kampanye yang di-pause" },
                { cmd: "\"Performa campaign mana yang paling bagus minggu ini?\"", desc: "Analisis performa komparatif" },
              ].map((item) => (
                <div key={item.cmd} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                  <code className="text-xs text-primary font-mono shrink-0">{item.cmd}</code>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Callout type="tip">
          Klik tombol <strong>Morning Brief</strong> atau <strong>Performance Report</strong> untuk meminta laporan instan kapan saja — tidak perlu menunggu jadwal otomatis.
        </Callout>
      </Section>

      {/* Section 8: Agent Memory */}
      <Section icon={Database} title="Agent Memory — Memori AI" subtitle="Database pembelajaran AI dari setiap kampanye yang dijalankan">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Setiap kampanye yang berjalan mengajarkan sesuatu pada AI. Agent Memory menyimpan pola kemenangan dan kegagalan per bisnis, sehingga setiap pipeline berikutnya semakin akurat.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "🏆 Winning Audience", desc: "Segmen audience yang terbukti menghasilkan leads/sales terbaik" },
            { label: "✍️ Winning Copy", desc: "Pola copywriting yang menghasilkan CTR dan konversi tertinggi" },
            { label: "📢 Winning Headline", desc: "Headline yang paling banyak diklik" },
            { label: "🎯 Winning CTA", desc: "Call-to-action yang paling efektif" },
            { label: "💰 Winning Offer", desc: "Struktur penawaran yang paling banyak direspon" },
            { label: "❌ Failed Pattern", desc: "Pola yang terbukti tidak efektif — dihindari pipeline berikutnya" },
          ].map((item) => (
            <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Callout type="info">
          Agent Memory digunakan secara otomatis saat Pipeline baru dijalankan untuk bisnis yang sama. Tidak perlu mengisi manual — AI belajar sendiri dari data performa kampanye.
        </Callout>
      </Section>

      {/* AI Provider Info */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">🤖 AI Provider yang Digunakan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { provider: "DeepSeek V3", task: "Blueprint Generator", badge: "Structured JSON", color: "text-blue-400" },
            { provider: "DeepSeek V3", task: "Chatbot Landing", badge: "Conversational", color: "text-blue-400" },
            { provider: "Gemini 2.0 Flash", task: "Morning Brief", badge: "Data Analysis", color: "text-purple-400" },
            { provider: "Qwen Max", task: "Performance Report", badge: "Bahasa Indonesia", color: "text-orange-400" },
            { provider: "GPT-4o-mini", task: "Copilot Commands", badge: "Tool Use", color: "text-emerald-400" },
            { provider: "OpenRouter", task: "Fallback", badge: "Meta-provider", color: "text-muted-foreground" },
          ].map((item) => (
            <div key={item.task} className="p-3 rounded-lg bg-secondary/40 border border-border">
              <p className={`text-xs font-bold ${item.color}`}>{item.provider}</p>
              <p className="text-xs text-foreground mt-0.5">{item.task}</p>
              <Badge variant="default">{item.badge}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border bg-secondary/30">
          <h2 className="font-bold text-foreground">❓ FAQ</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            {
              q: "Berapa lama pipeline AI berjalan?",
              a: "Rata-rata 1–3 menit tergantung kompleksitas brief dan kondisi jaringan ke server AI.",
            },
            {
              q: "Apakah kampanye langsung aktif setelah disetujui?",
              a: "Tidak. Kampanye dikirim ke Meta dalam status PAUSED. Anda harus mengaktifkannya secara manual dari halaman Campaign Detail atau Ads Manager. Ini untuk mencegah pengeluaran yang tidak disengaja.",
            },
            {
              q: "Apa yang terjadi jika 0 interests matched di Human Gate?",
              a: "Tombol Approve akan diblokir. Ini artinya tidak ada interest yang direkomendasikan AI tersedia di database Meta. Jalankan pipeline baru dengan brief yang lebih spesifik atau adjust target market.",
            },
            {
              q: "Bisakah saya edit blueprint sebelum disetujui?",
              a: "Saat ini blueprint tidak bisa diedit manual — Anda bisa reject dan jalankan pipeline baru dengan additional context yang lebih spesifik sebagai panduan untuk AI.",
            },
            {
              q: "Apakah data bisnis saya aman?",
              a: "Ya. Semua data disimpan di database PostgreSQL pribadi di server Anda. Data tidak dikirim ke pihak ketiga selain untuk keperluan call ke API AI (OpenAI, DeepSeek, Gemini, Qwen).",
            },
            {
              q: "Copilot tidak merespons perintah saya dengan benar?",
              a: "Coba perintah yang lebih spesifik. Contoh: daripada 'pause iklan', gunakan 'pause kampanye [ID]'. ID kampanye bisa dilihat di halaman Campaigns.",
            },
          ].map((item) => (
            <div key={item.q} className="p-5 space-y-1">
              <p className="text-sm font-semibold text-foreground">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        AdClaw AI — Panduan ini diperbarui seiring perkembangan platform.
      </div>
    </Shell>
  )
}
