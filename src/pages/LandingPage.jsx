import { useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const LandingDemo3D = lazy(() => import('../components/LandingDemo3D/LandingDemo3D'));

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
    title: 'Builder modeli 3D',
    desc: 'Buduj interaktywne modele z gotowych kształtów 3D – sześcianów, sfer, cylindrów i stożków. Bez znajomości oprogramowania CAD.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
    title: 'Import własnych modeli',
    desc: 'Wgrywaj rzeczywiste modele produktów w formatach GLTF/GLB i twórz dokumentację klikając bezpośrednio na elementy modelu.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-600',
    title: 'Instrukcje krok po kroku',
    desc: 'Twórz sekwencyjne przewodniki montażu z podświetlaniem elementów, opisami i wskazówkami – idealne do manualów obsługi.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    gradient: 'from-pink-500 to-rose-600',
    title: 'Udostępnij jednym kliknięciem',
    desc: 'Wygeneruj unikalny link do dokumentacji i udostępnij go klientom, partnerom lub pracownikom – bez logowania po ich stronie.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Wgraj lub zbuduj model',
    desc: 'Zaimportuj plik GLTF/GLB swojego produktu albo zbuduj model 3D z gotowych kształtów geometrycznych.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    num: '02',
    title: 'Dodaj kroki i opisy',
    desc: 'Kliknij na elementy modelu, dodaj podświetlenia, tytuły kroków i szczegółowe opisy. Układaj je w logiczną sekwencję.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    num: '03',
    title: 'Udostępnij link',
    desc: 'Jednym kliknięciem wygeneruj publiczny link do instrukcji. Odbiorca otwiera ją w przeglądarce – bez instalacji i logowania.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
];

const useCases = [
  { emoji: '🔧', label: 'Instrukcje montażu' },
  { emoji: '📦', label: 'Dokumentacja produktów' },
  { emoji: '🎓', label: 'Szkolenia techniczne' },
  { emoji: '🏭', label: 'Procesy produkcyjne' },
  { emoji: '🛠️', label: 'Konserwacja maszyn' },
  { emoji: '🖥️', label: 'Prezentacje sprzedażowe' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12 shadow-md">
                <svg className="w-5 h-5 text-white transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">3D Docs</span>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Zaloguj się
              </button>
              <button
                onClick={() => navigate('/guest')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Wypróbuj za darmo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-24">
        {/* Background blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-4 px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
            🚀 Dokumentacja techniczna nowej generacji
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Twórz interaktywną{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              dokumentację 3D
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            3D Docs to platforma dla inżynierów, techników i producentów. Wizualizuj produkty,
            twórz instrukcje krok po kroku i udostępniaj je błyskawicznie — bez instalacji
            i bez kodu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/guest')}
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
            >
              Zacznij za darmo — bez rejestracji
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Mam już konto
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Bez rejestracji
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Obsługa GLTF / GLB
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Linki do udostępnienia
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Działa w przeglądarce
            </div>
          </div>
        </div>
      </section>

      {/* ── Live 3D Demo ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900" id="demo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block mb-3 px-4 py-1.5 bg-blue-900/60 text-blue-300 text-sm font-semibold rounded-full">
              🎮 Interaktywne demo na żywo
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Przekonaj się sam, jak to działa
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Oba tryby pracy 3D Docs w jednym miejscu. Przełącz zakładkę by zobaczyć budowanie
              modelu z kształtów geometrycznych lub pracę z wgranym modelem 3D — krok po kroku.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center h-72 rounded-3xl bg-gray-900 border border-gray-800">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Ładowanie modelu 3D…</span>
                </div>
              </div>
            }
          >
            <LandingDemo3D />
          </Suspense>

          <p className="text-center text-gray-600 text-sm mt-6">
            Model obraca się automatycznie · Przeciągnij aby zmienić kąt widzenia · Kliknij krok aby przejść do niego
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white" id="funkcje">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Od importu modelu po gotowy link z instrukcją — w kilka minut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center text-white mb-5 shadow-md group-hover:scale-105 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50" id="jak-dziala">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Jak to działa?
            </h2>
            <p className="text-xl text-gray-500">
              Trzy kroki od modelu do gotowej instrukcji.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className={`${s.bg} border ${s.border} rounded-2xl p-8 text-center`}>
                <div className={`text-5xl font-black ${s.color} mb-4 opacity-30`}>{s.num}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Dla kogo jest 3D Docs?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Wszędzie tam, gdzie złożone rzeczy trzeba wytłumaczyć prosto i wizualnie.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {useCases.map((u) => (
              <div
                key={u.label}
                className="flex items-center gap-3 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-700 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                <span className="text-xl">{u.emoji}</span>
                {u.label}
              </div>
            ))}
          </div>

          {/* Testimonial-style highlight */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-10 text-center text-white shadow-2xl">
            <p className="text-2xl font-semibold mb-2 leading-snug">
              „Zamiast 20-stronicowego PDF-a z rysunkami technicznymi,<br />
              teraz wysyłamy klientom jeden link."
            </p>
            <p className="text-blue-200 text-sm mt-4">— Przykładowe zastosowanie w branży przemysłowej</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-12 shadow-xl">
            <svg className="w-12 h-12 text-white transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Gotowy do działania?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Wypróbuj 3D Docs za darmo — bez rejestracji i bez ograniczeń czasowych.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/guest')}
              className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
            >
              Zacznij teraz — za darmo
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-purple-400 hover:text-purple-600 rounded-2xl shadow-lg transition-all"
            >
              Zaloguj się
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform rotate-12">
              <svg className="w-4 h-4 text-white transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-bold">3D Docs</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} 3D Docs — interaktywna dokumentacja 3D
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
