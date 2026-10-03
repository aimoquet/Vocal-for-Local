"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Activity, Cpu, UploadCloud, Database, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-24 px-4 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="z-10 text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20 mb-6">
              <ShieldCheck className="h-4 w-4" />
              <span>AI-POWERED AUDIO FORENSICS</span>
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
              Can You Trust the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Voice?</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Vocal for Local analyzes audio signals using machine learning to identify synthetic and AI-generated speech with forensic precision.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link href="/analyze">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white group">
                Analyze Audio
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-white/20 hover:bg-white/5">
                Explore How It Works
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Voice Deepfakes Matter */}
      <section className="py-24 bg-black/40 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Voice Deepfakes Matter</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The rise of generative AI has made voice cloning accessible, leading to new vectors of cyber threats.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Financial Fraud", desc: "Attackers use cloned voices of executives to authorize fraudulent wire transfers.", icon: AlertTriangle },
              { title: "Social Engineering", desc: "Scammers impersonate family members in distress to extort money.", icon: Lock },
              { title: "Misinformation", desc: "Synthetic audio is deployed to spread fake news and manipulate public opinion.", icon: Activity }
            ].map((item, i) => (
              <div key={i} className="glass-panel p-6 rounded-xl flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our pipeline transforms raw audio into acoustic features for deep learning classification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              { step: "01", title: "Upload Audio", desc: "Submit WAV, MP3, FLAC, or M4A files up to 25MB.", icon: UploadCloud },
              { step: "02", title: "Preprocess Signal", desc: "Normalize amplitude, resample, and remove silence.", icon: Activity },
              { step: "03", title: "Extract Features", desc: "Compute MFCCs and Mel Spectrograms.", icon: Database },
              { step: "04", title: "ML Classification", desc: "A CNN analyzes the acoustic features to detect anomalies.", icon: Cpu }
            ].map((item, i) => (
              <div key={i} className="relative glass-panel p-6 rounded-xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-6xl font-bold text-white/5 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <item.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-t from-primary/10 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to detect deepfakes?</h2>
          <Link href="/analyze">
            <Button size="lg" className="text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-white">
              Analyze Your Audio Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
