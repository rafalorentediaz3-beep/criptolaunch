import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

const sections = [
  {
    title: "Elegibilidad de las wallets",
    body: "Las recompensas están previstas para wallets vinculadas a tokens que cumplan los criterios que publique el proyecto. Tener un token o conectar una wallet no garantiza por sí solo recibir una recompensa.",
  },
  {
    title: "Cumplimiento normativo",
    body: "La participación y cualquier distribución estarán sujetas a la normativa aplicable y a las restricciones de elegibilidad que se indiquen en las condiciones oficiales. Podremos requerir información adicional para verificar la elegibilidad cuando corresponda.",
  },
  {
    title: "Criterios y distribución",
    body: "Los criterios concretos, el calendario y el mecanismo de distribución se publicarán antes de cualquier campaña. Esta página se actualizará cuando esas condiciones estén definidas.",
  },
];

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-4xl py-8 sm:py-14">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-lime-300">
        <ArrowLeft className="h-4 w-4" /> Volver al launchpad
      </Link>

      <section className="matrix-hero relative isolate mt-7 overflow-hidden rounded-[28px] border border-lime-400/20 px-5 py-9 sm:px-10 sm:py-12">
        <div aria-hidden className="matrix-rain absolute inset-0 -z-10" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-black/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lime-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Transparencia del launchpad
          </span>
          <h1 className="matrix-title mt-5 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">Normativa de recompensas</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base sm:leading-7">
            El misterio sigue abierto; las reglas de elegibilidad no. Aquí reuniremos los criterios que se apliquen a las recompensas para wallets de tokens.
          </p>
        </div>
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-lime-300/15 bg-lime-300/[0.045] p-4 sm:p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-lime-300" />
        <p className="text-sm leading-6 text-neutral-300">
          <span className="font-semibold text-white">Recompensas previstas.</span> Los detalles de cada campaña se anunciarán públicamente antes de su distribución. No se garantiza una recompensa por conectar una wallet o mantener un token.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {sections.map((section, index) => (
          <section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <p className="font-mono text-xs text-lime-300/80">0{index + 1} / NORMATIVA</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">{section.body}</p>
          </section>
        ))}
      </div>

      <Link href="/" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-lime-300 transition hover:text-lime-200">
        Explorar los tokens <ArrowUpRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
