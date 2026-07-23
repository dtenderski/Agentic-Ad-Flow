import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Chatbot } from '@/components/Chatbot';
import { Target, TrendingUp, Zap, ShieldAlert, CheckCircle2, Clock, BrainCircuit, Activity, BarChart3, Fingerprint, RefreshCcw, X } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const yMockup = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="text-primary-foreground" size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">Agentic AdFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">Masalah</a>
            <a href="#agents" className="hover:text-foreground transition-colors">Agen AI</a>
            <a href="#features" className="hover:text-foreground transition-colors">Fitur</a>
          </div>
          <button onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors">
            Dapatkan Akses
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-10 pb-20 px-6 bg-grid-pattern">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center relative z-10 space-y-8"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Mesin iklan bertenaga Claude AI — kini dalam beta
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Berhenti kelola kampanye. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground">
                Mulai kelola agen.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Agentic AdFlow menulis, membangun, dan mempublikasikan kampanye iklan berkualitas tinggi ke Meta, Google, TikTok, dan LinkedIn dalam hitungan menit. Kamu yang setujui, AI yang eksekusi.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="max-w-xl mx-auto pt-4">
              <WaitlistForm />
              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2">
                <ShieldAlert size={14} /> Bergabung dengan 2.000+ marketer di daftar tunggu
              </p>
            </motion.div>
          </motion.div>

          {/* Hero UI Mockup */}
          <motion.div 
            style={{ y: yMockup }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-6xl mx-auto mt-20 relative z-10"
          >
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
              {/* Sidebar Mock */}
              <div className="w-full md:w-64 bg-muted/30 border-r border-border p-4 hidden md:block">
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded-md w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/6"></div>
                  </div>
                </div>
              </div>
              {/* Main Content Mock */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-xl">Kampanye: Blitz Pertumbuhan Q4</h3>
                    <p className="text-sm text-muted-foreground">Dibuat oleh OpenClaw AI</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-full font-medium flex items-center gap-1">
                      <Clock size={14} /> Menunggu Persetujuan
                    </div>
                  </div>
                </div>
                
                {/* Scoring metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Kesiapan Konversi', score: 94, color: 'text-green-500' },
                    { label: 'Kekuatan Kreatif', score: 88, color: 'text-primary' },
                    { label: 'Kesesuaian Funnel', score: 91, color: 'text-blue-500' },
                    { label: 'Risiko Kebijakan', score: 12, color: 'text-green-500', isLowGood: true },
                  ].map((metric, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-background">
                      <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">{metric.label}</p>
                      <div className={`text-3xl font-bold ${metric.color}`}>{metric.score}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-6">
                  <div className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">Minta Revisi</div>
                  <div className="px-6 py-2 bg-foreground text-background rounded-lg text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Setujui & Tayangkan
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* PROBLEM & AGITATE */}
        <section id="problem" className="py-24 px-6 bg-foreground text-background">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-6">
                  Kamu buang berjam-jam cuma klik-klik di Ads Manager.
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-xl text-muted/80 mb-8 leading-relaxed">
                  Setup kampanye tidak berubah dalam 10 tahun terakhir. Kamu masih duplikat ad set, nebak-nebak interest, dan berharap tidak lupa matikan broad match keyword.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-4">
                  {[
                    "Biaya agensi menggerus margin kamu.",
                    "Budget terbakar karena targeting yang salah.",
                    "Berminggu-minggu menunggu approval kreatif.",
                  ].map((item, i) => (
                    <motion.li key={i} variants={fadeInUp} className="flex items-center gap-3 text-lg font-medium">
                      <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                        <X size={14} />
                      </div>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-background/5 border border-background/10 p-8 rounded-3xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BarChart3 size={120} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Kondisi Saat Ini</h3>
                <div className="space-y-6 relative z-10">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Waktu untuk strategi</span>
                      <span className="font-mono text-muted/60">10%</span>
                    </div>
                    <div className="h-2 w-full bg-background/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[10%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Waktu klik-klik di UI</span>
                      <span className="font-mono text-muted/60">90%</span>
                    </div>
                    <div className="h-2 w-full bg-background/20 rounded-full overflow-hidden">
                      <div className="h-full bg-destructive w-[90%]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SOLUTION (The Agents) */}
        <section id="agents" className="py-24 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Kenali tim pertumbuhan barumu.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Agentic AdFlow ditenagai oleh dua agen Claude AI khusus yang bekerja bersama untuk menskalakan bisnismu.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* MultiClaw */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit size={160} />
              </div>
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">MultiClaw</h3>
              <p className="text-sm font-mono text-primary mb-4">SANG STRATEGI</p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                MultiClaw menganalisis bisnis kamu, membaca landing page-mu, dan mendiagnosa audiensmu. Ia menentukan sudut pandang, mengidentifikasi pain point yang tepat, dan merancang struktur kampanye yang sempurna.
              </p>
              <ul className="space-y-2 text-sm font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Pembuatan Persona Audiens</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Struktur Penawaran</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Strategi Alokasi Anggaran</li>
              </ul>
            </motion.div>

            {/* OpenClaw */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border p-8 rounded-3xl relative overflow-hidden group hover:border-accent-foreground/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={160} />
              </div>
              <div className="w-14 h-14 bg-accent text-accent-foreground rounded-2xl flex items-center justify-center mb-6">
                <Fingerprint size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">OpenClaw</h3>
              <p className="text-sm font-mono text-accent-foreground mb-4">SANG EKSEKUTOR</p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                OpenClaw mengambil strategi dan membangunnya. Ia memilih interest di Meta, menulis copy iklan, menghasilkan variasi kreatif, dan mendorong langsung ke platform melalui API.
              </p>
              <ul className="space-y-2 text-sm font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-foreground"/> Integrasi API Platform Langsung</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-foreground"/> Penulisan Copy & Generasi Kreatif</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-accent-foreground"/> Pemeriksaan Kepatuhan Kebijakan</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* FEATURES / DESIRE */}
        <section id="features" className="py-24 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              
              <div className="md:col-span-2 bg-foreground text-background p-10 rounded-3xl relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                  <h3 className="text-3xl font-bold mb-4">Gerbang Persetujuan Manusia</h3>
                  <p className="text-lg text-muted/80 mb-8">
                    AI yang kerja keras, tapi kamu yang pegang kendali. Tidak ada yang tayang tanpa persetujuan eksplisitmu. Tinjau targeting, copy, dan batas pengeluaran sebelum menyentuh jaringan iklan.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg">
                    <ShieldAlert size={18} /> Kontrol 100% Terjaga
                  </div>
                </div>
                {/* Abstract graphic */}
                <div className="absolute -right-20 -bottom-20 w-96 h-96 border-[40px] border-background/5 rounded-full" />
                <div className="absolute -right-10 -bottom-10 w-80 h-80 border-[40px] border-background/5 rounded-full" />
              </div>

              <div className="bg-card border border-border p-10 rounded-3xl flex flex-col justify-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Copilot Harian</h3>
                <p className="text-muted-foreground mb-6">
                  Bangun pagi dengan briefing tren terkini. Tutup hari dengan laporan performa mendalam. Copilot memberi tahu apa yang perlu di-scale dan apa yang harus dihentikan.
                </p>
                <div className="flex items-center gap-2 text-sm font-mono text-primary font-medium">
                  <RefreshCcw size={16} /> Otomatis Setiap Hari
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="py-32 px-6 bg-primary text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6">Siap pecat agency-mu?</h2>
            <p className="text-xl text-primary-foreground/80 mb-10 font-medium">
              Berhenti bayar retainer untuk tugas yang bisa diselesaikan AI dalam 4 menit. Daftar ke waitlist Agentic AdFlow dan dapatkan akses awal ke beta.
            </p>
            <div className="bg-background p-2 rounded-2xl shadow-2xl max-w-xl mx-auto text-foreground">
              <WaitlistForm />
            </div>
            <p className="text-sm text-primary-foreground/60 mt-6 font-mono">
              TANPA KARTU KREDIT • BATALKAN AGENCY-MU NANTI
            </p>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border bg-background">
        <p>© {new Date().getFullYear()} Agentic AdFlow. Dibangun dengan Claude AI.</p>
      </footer>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}
