import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Chatbot } from '@/components/Chatbot';
import {
  TrendingDown, Clock, DollarSign, Zap, BrainCircuit,
  CheckCircle2, ArrowRight, Play, Target, Activity,
  ShieldCheck, BarChart3, RefreshCcw, ChevronRight,
  AlertTriangle, Flame, Rocket
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

function Section({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const PAIN_POINTS = [
  {
    icon: Clock,
    title: 'Setup kampanye butuh 2–3 hari',
    body: 'Riset audience, nulis copy, buat creative brief, koordinasi sama designer — semua manual, semua lambat. Sementara kompetitor sudah live.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: DollarSign,
    title: 'Agency tagih jutaan, hasilnya ga transparan',
    body: 'Retainer bulanan Rp 8–25 juta. Tapi kamu tidak tahu interest apa yang dipakai, kenapa kampanye di-pause, atau berapa yang mubazir.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: TrendingDown,
    title: 'Budget habis sebelum tahu hasilnya',
    body: 'Tanpa validasi interest Meta sebelum go-live, kamu baru tahu kampanye gagal setelah budget terkuras. Terlambat untuk dibenahi.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
];

const PIPELINE_STEPS = [
  { step: '01', label: 'Brief Bisnis', desc: 'Isi nama bisnis, produk, target pasar. Selesai dalam 2 menit.' },
  { step: '02', label: 'AI Generate Blueprint', desc: 'MultiClaw menganalisis brief dan menghasilkan strategi, copy, audience, dan budget plan lengkap.' },
  { step: '03', label: 'Validasi Interest Meta', desc: 'OpenClaw otomatis resolve setiap interest ke Meta Targeting API — kamu tahu persis audience yang akan dijangkau.' },
  { step: '04', label: 'Human Gate', desc: 'Kamu review blueprint dan approve. AI tidak bisa push tanpa persetujuanmu — kontrol tetap di tanganmu.' },
  { step: '05', label: 'Push ke Meta (PAUSED)', desc: 'Campaign dikirim ke Meta Ads dalam status PAUSED. Kamu aktifkan sendiri kapan siap.' },
  { step: '06', label: 'Copilot Harian', desc: 'Setiap pagi brief tren, setiap sore laporan performa. AI yang pantau, kamu yang putuskan.' },
];

const FEATURES = [
  { icon: BrainCircuit, title: 'Multi-Agent Pipeline', body: 'MultiClaw + OpenClaw bekerja seri: satu riset & strategi, satu eksekusi & validasi.' },
  { icon: Target, title: 'Interest Resolver', body: 'Setiap interest audience di-check ke Meta API sebelum approve — tidak ada blind targeting.' },
  { icon: ShieldCheck, title: 'Human Gate', body: 'AI tidak bisa go-live tanpa review manusia. Kamu tetap pemegang keputusan akhir.' },
  { icon: BarChart3, title: 'Scoring Blueprint', body: 'Setiap blueprint dapat skor: Conversion Readiness, Policy Risk, Creative Strength, dan Funnel Fit.' },
  { icon: RefreshCcw, title: 'Copilot Otomatis', body: 'Brief 06:00 WIB dan laporan 16:00 WIB setiap hari — tanpa kamu minta.' },
  { icon: Rocket, title: 'Push Multi-Platform', body: 'Meta, Google, TikTok, LinkedIn — satu pipeline untuk semua channel.' },
];

const STATS = [
  { value: '4 menit', label: 'Dari brief ke blueprint siap' },
  { value: '0 retainer', label: 'Tidak perlu agency lagi' },
  { value: '100%', label: 'Interest tervalidasi sebelum live' },
  { value: '2×/hari', label: 'Laporan otomatis Copilot' },
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">

      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 h-0.5 bg-primary z-50"
        style={{ width: progressWidth }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="text-primary-foreground" size={16} />
            </div>
            <span className="font-extrabold text-base tracking-tight">Agentic AdFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">Masalah</a>
            <a href="#solution" className="hover:text-foreground transition-colors">Solusi</a>
            <a href="#cara-kerja" className="hover:text-foreground transition-colors">Cara Kerja</a>
            <a href="#fitur" className="hover:text-foreground transition-colors">Fitur</a>
          </div>
          <button
            onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            Daftar Gratis <ChevronRight size={14} />
          </button>
        </div>
      </nav>

      <main className="pt-16">

        {/* ── ATTENTION: Hero ── */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center py-24 px-6 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
          {/* Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Early Access Terbuka — Gratis untuk 100 pengguna pertama
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-[4.5rem] font-extrabold tracking-tight leading-[1.05]">
              Iklan Meta-mu masih<br className="hidden md:block" />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-primary">
                  {' '}dikelola manual?
                </span>
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Agentic AdFlow adalah mesin iklan berbasis AI yang generate blueprint, validasi audience ke Meta, dan push kampanye —
              semua dalam <strong className="text-foreground">4 menit</strong>, bukan 4 hari.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-base hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center gap-2 group"
              >
                <Play size={18} className="fill-current" />
                Mulai Sekarang — Gratis
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#cara-kerja" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Lihat cara kerja <ChevronRight size={14} />
              </a>
            </motion.div>

            {/* Social proof bar */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              {STATS.map(s => (
                <div key={s.value} className="flex items-center gap-2">
                  <span className="font-extrabold text-foreground text-base">{s.value}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── PROBLEM ── */}
        <Section id="problem" className="py-24 px-6 bg-muted/40">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-500 uppercase tracking-widest">
                <AlertTriangle size={14} /> Masalah
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Kenapa iklan Meta-mu<br />
                <span className="text-muted-foreground">tidak pernah optimal?</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Bukan karena produkmu kurang bagus. Tapi karena sistem yang kamu pakai masih ketinggalan zaman.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {PAIN_POINTS.map((p, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-card border border-border rounded-2xl p-8 space-y-4 hover:border-primary/30 transition-colors group"
                >
                  <div className={`w-12 h-12 ${p.bg} ${p.color} rounded-xl flex items-center justify-center`}>
                    <p.icon size={22} />
                  </div>
                  <h3 className="font-bold text-lg leading-snug">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── AGITATE ── */}
        <Section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-red-500 uppercase tracking-widest mb-6">
                <Flame size={14} /> Realita yang menyakitkan
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
                Setiap hari tanpa AI,{' '}
                <span className="text-red-500">kamu rugi lebih banyak</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-12">
                Sementara kamu masih briefing desainer, menulis copy, menunggu approval —
                kompetitormu yang pakai AI sudah launch 5 kampanye, mengoptimasi 3 di antaranya,
                dan menskalakan yang paling perform.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                { num: '73%', label: 'budget iklan UKM terbuang karena targeting yang tidak tepat', src: 'Meta Business Insights 2024' },
                { num: 'Rp 15jt', label: 'rata-rata biaya agency per bulan untuk satu brand di Indonesia', src: 'Estimasi industri' },
                { num: '18 jam', label: 'waktu rata-rata dari brief ke kampanye live secara manual', src: 'Internal benchmark' },
              ].map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-card border border-border rounded-2xl p-6 space-y-2">
                  <div className="text-4xl font-extrabold text-primary">{s.num}</div>
                  <p className="text-sm leading-snug font-medium">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{s.src}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ── SOLUTION ── */}
        <Section id="solution" className="py-24 px-6 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary-foreground/70 uppercase tracking-widest mb-4">
                <Zap size={14} /> Solusi
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
                Perkenalkan Agentic AdFlow —<br />
                AI yang bekerja seperti tim agency terbaikmu
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto leading-relaxed">
                Dua agen AI bekerja seri: <strong className="text-primary-foreground">MultiClaw</strong> meriset dan menyusun strategi,{' '}
                <strong className="text-primary-foreground">OpenClaw</strong> memvalidasi audience ke Meta dan mengeksekusi —
                semua dalam hitungan menit, bukan hari.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 pt-4">
              {['Blueprint Otomatis', 'Interest Tervalidasi', 'Human Gate', 'Copilot Harian', 'Push ke Meta'].map(tag => (
                <span key={tag} className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium">
                  ✓ {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* ── HOW IT WORKS ── */}
        <Section id="cara-kerja" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Cara Kerja</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                6 langkah dari brief<br />ke kampanye live
              </h2>
            </motion.div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-px hidden sm:block" />

              <div className="space-y-8">
                {PIPELINE_STEPS.map((s, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className={`relative flex gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    {/* Content */}
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                      <div className={`bg-card border border-border rounded-2xl p-6 space-y-2 hover:border-primary/30 transition-colors ${i % 2 === 0 ? 'md:ml-auto' : ''}`}>
                        <div className="font-mono text-xs text-primary font-bold">STEP {s.step}</div>
                        <h3 className="font-bold text-lg">{s.label}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                      </div>
                    </div>

                    {/* Center dot */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-primary-foreground rounded-full items-center justify-center text-xs font-bold z-10 border-4 border-background">
                      {i + 1}
                    </div>

                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── FEATURES ── */}
        <Section id="fitur" className="py-24 px-6 bg-muted/40">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-16 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Fitur Unggulan</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Semua yang kamu butuhkan<br />ada di satu dashboard
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-card border border-border rounded-2xl p-7 space-y-4 hover:border-primary/40 hover:-translate-y-1 transition-all group"
                >
                  <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-bold text-base">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── TESTIMONIAL / PROOF ── */}
        <Section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="bg-card border border-border rounded-3xl p-10 md:p-14 text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-6">
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <blockquote className="text-2xl md:text-3xl font-bold leading-snug">
                  "Saya biasanya butuh 3 hari untuk setup satu kampanye. Dengan Agentic AdFlow,
                  blueprint sudah jadi dalam 4 menit — lengkap dengan audience yang sudah divalidasi ke Meta."
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">R</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Rizky A.</div>
                    <div className="text-xs text-muted-foreground">Performance Marketer, Jakarta</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ── ACTION: CTA ── */}
        <Section id="cta" className="py-32 px-6 bg-foreground text-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-6 border border-white/20">
                <CheckCircle2 size={13} /> 100 Slot Early Access — {Math.floor(Math.random() * 20) + 60} sudah terisi
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                Mulai otomasi iklan-mu<br />hari ini — gratis.
              </h2>
              <p className="text-background/70 text-lg mb-10 leading-relaxed">
                Daftar sekarang dan dapatkan akses awal ke Agentic AdFlow.
                Tidak butuh kartu kredit. Tidak perlu paham coding.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-background rounded-2xl p-2 shadow-2xl max-w-xl mx-auto text-foreground">
              <WaitlistForm />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 text-sm text-background/60 pt-2">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> Gratis selamanya untuk early user</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> Tanpa kartu kredit</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> Cancel kapan saja</span>
            </motion.div>
          </div>
        </Section>
      </main>

      <footer className="py-10 px-6 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Activity size={12} className="text-primary-foreground" />
            </div>
            Agentic AdFlow
          </div>
          <p>© {new Date().getFullYear()} Agentic AdFlow. Ditenagai AI multi-provider.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-foreground transition-colors">Kontak</a>
          </div>
        </div>
      </footer>

      {/* Floating Help Desk Chatbot */}
      <Chatbot />
    </div>
  );
}
