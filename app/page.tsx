import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-green-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl text-gray-900">AgendaAí</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Começar grátis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Plataforma de agendamentos online
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight max-w-3xl">
          Seus agendamentos,{" "}
          <span className="text-green-500">simples assim</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mb-10">
          Crie sua página de agendamento em minutos. Deixe seus clientes
          marcarem horários 24h por dia, sem precisar te ligar.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/auth/register"
            className="px-8 py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5"
          >
            Criar minha página grátis →
          </Link>
          <Link
            href="/demo"
            className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-green-300 hover:text-green-600 transition-all"
          >
            Ver demonstração
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "📅", title: "Página pública", desc: "Compartilhe um link e seus clientes agendam sozinhos" },
            { icon: "🔔", title: "Dashboard completo", desc: "Veja todos os agendamentos organizados em um só lugar" },
            { icon: "⚙️", title: "Configure seus horários", desc: "Defina seus dias e horários de atendimento com facilidade" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
