import { useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const LandingDemo3D = lazy(() => import('../components/LandingDemo3D/LandingDemo3D'));

const LOGO_SRC = '/logo.svg';

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
    title: 'Prezentuj swoje rozwiązania',
    desc: 'Zamień architekturę, flow danych i mikroserwisy w interaktywny model 3D. Pokaż swój pomysł — zamiast go tłumaczyć przez godzinę na spotkaniu.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
    title: 'Onboarding bez bólu głowy',
    desc: 'Nowy developer rozumie cały stos technologiczny już pierwszego dnia — bez przedzierania się przez 200-stronicowe wiki i bez bombardowania seniorów pytaniami.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-600',
    title: 'Runbooki i procedury',
    desc: 'Deploy, incident response, maintenance — dokumentuj je jako sekwencje kroków z podświetlaniem węzłów. Koniec z wiedzą zamkniętą w głowach senior devów.',
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
    desc: 'Wygeneruj link i wyślij — bez instalacji, bez logowania po drugiej stronie. Twój model działa od razu w przeglądarce, na każdym urządzeniu.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Zbuduj interaktywny model',
    desc: 'Dodaj węzły — serwery, serwisy, bazy danych — połącz je strzałkami i nadaj każdemu kolor. Twoja architektura IT w 3D gotowa w kilka minut.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    num: '02',
    title: 'Podziel wiedzę na kroki',
    desc: 'Do każdego węzła dodaj krótki opis — jeden krok, jedna informacja. Ułóż je w sekwencję, którą odbiorca przejdzie samodzielnie, we własnym tempie.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    num: '03',
    title: 'Udostępnij — zero instalacji',
    desc: 'Kliknij „Share", skopiuj link i wyślij. Odbiorca otwiera model w przeglądarce — bez rejestracji, bez instalowania czegokolwiek, na każdym urządzeniu.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
];

const useCases = [
  { emoji: '🖥️', label: 'Architektura systemów' },
  { emoji: '💡', label: 'Prezentacja rozwiązania' },
  { emoji: '🚀', label: 'Onboarding deweloperów' },
  { emoji: '📋', label: 'Runbooki i playbooki' },
  { emoji: '🔐', label: 'Dokumentacja bezpieczeństwa' },
  { emoji: '🔄', label: 'Procesy CI/CD' },
  { emoji: '🧩', label: 'Mapa mikroserwisów' },
  { emoji: '🎯', label: 'Pitch techniczny' },
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
              <img src={LOGO_SRC} alt="ThreeDocsy logo" className="h-9 w-auto" />
              <span className="text-xl font-bold text-gray-900">ThreeDocsy</span>
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
            ⚡ Narzędzie dla developerów i architektów IT
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Pokaż swój system.{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Przestań go tylko opisywać.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            ThreeDocsy to narzędzie dla ludzi, którzy chcą szybko i efektownie
            zaprezentować swoje rozwiązania, wizje i architekturę.
            Interaktywne bloki zamiast suchych PDF-ów —
            jedna&nbsp;rzecz na raz, zero przeciążenia informacyjnego.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/guest')}
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
            >
              Utwórz model za darmo — bez rejestracji
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
              Dla IT i programistów
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
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              🧠 Interaktywna nauka
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
              Tak wygląda ThreeDocsy w akcji
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Poniżej przykład prawdziwego modelu — architektura IT z krokami.
              Przełącz zakładki, kliknij kroki nawigacji i przekonaj się,
              że to tak samo działa jak strona, którą właśnie tworzysz.
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
            Przeciągnij aby zmienić kąt widzenia · Scroll aby powiększyć · Przełącz tryb kamery Auto / Free
          </p>
        </div>
      </section>

      {/* ── Why interactive learning works ───────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-4 py-1.5 bg-purple-900/50 text-purple-300 text-sm font-semibold rounded-full">
              🧠 Nauka przez działanie
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Dlaczego interaktywność bije dokumentację?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              PDF-y i wiki leżą nieprzeczytane. ThreeDocsy sprawia, że odbiorca
              sam odkrywa system — krok po kroku, we własnym tempie.
              Efekt? Mniej pytań do Ciebie, szybszy onboarding, lepsze zrozumienie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                🧠
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Aktywna eksploracja</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Klikanie, obracanie modelu i nawigacja krok po kroku angażują pamięć
                przestrzenną i motoryczną.{' '}
                <span className="text-blue-400 font-semibold">
                  Interaktywna nauka angażuje bardziej niż pasywne czytanie.
                </span>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                📌
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Jeden krok = jedna informacja</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Każdy krok zawiera dokładnie jedną myśl. Odbiorca nie jest przytłoczony —
                {' '}
                <span className="text-green-400 font-semibold">
                  żadnej ściany tekstu,
                </span>{' '}
                tylko konkretny węzeł i jego rola w systemie.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                🎯
              </div>
              <h3 className="text-white font-bold text-xl mb-3">3D angażuje bardziej</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Model 3D to nie tylko efekt wizualny — sama jego obecność
                sprawia, że odbiorca zostaje dłużej i{' '}
                <span className="text-purple-400 font-semibold">
                  buduje trwałą mentalną mapę systemu
                </span>{' '}
                zamiast zapamiętywać losowe fragmenty wiki.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white" id="funkcje">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Wszystko czego potrzebuje Twój zespół IT
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Od interaktywnego modelu systemu po gotowy link do prezentacji — w kilka minut.
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
              Trzy kroki od pustego płótna do gotowej interaktywnej prezentacji.
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
              Dla kogo jest ThreeDocsy?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Dla każdego programisty i zespołu IT, który ma coś do pokazania — i chce być rozumiany.
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
              „Zamiast tłumaczyć architekturę godzinami na spotkaniach —<br />
              wysyłam link. Każdy rozumie od razu."
            </p>
            <p className="text-blue-200 text-sm mt-4">— Przykładowe zastosowanie: senior developer w zespole productowym</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src={LOGO_SRC} alt="ThreeDocsy logo" className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Gotowy pokazać swój system?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stwórz pierwszy interaktywny model IT w 5 minut — za darmo, bez rejestracji.
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
            <img src={LOGO_SRC} alt="ThreeDocsy logo" className="h-7 w-auto brightness-0 invert" />
            <span className="font-bold">ThreeDocsy</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} ThreeDocsy — interaktywna dokumentacja IT
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
