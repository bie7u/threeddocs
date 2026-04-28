import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { probeSession } from '../services/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageDropdown } from '../i18n/LanguageDropdown';

const LOGO_SRC = '/logo.svg';

const STEP_STYLES = [
  { num: '01', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { num: '02', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { num: '03', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
];

const PROBLEM_ICONS = [
  <svg key="p1" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  <svg key="p2" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="p3" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
];

const FEATURE_DATA = [
  { gradient: 'from-blue-500 to-indigo-600', emoji: '🗺️' },
  { gradient: 'from-green-500 to-emerald-600', emoji: '📋' },
  { gradient: 'from-purple-500 to-violet-600', emoji: '🔗' },
  { gradient: 'from-orange-500 to-amber-600', emoji: '🔄' },
];

const USE_CASE_EMOJIS = ['🖥️', '🚀', '👥', '🚨', '🔐', '⚙️', '🏗️', '📊'];

const WHY_CARD_STYLES = [
  { gradient: 'from-teal-500 to-emerald-600', textColor: 'text-teal-300' },
  { gradient: 'from-blue-500 to-indigo-600', textColor: 'text-blue-300' },
  { gradient: 'from-purple-500 to-violet-600', textColor: 'text-purple-300' },
];

const RecruiterLandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const demoRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    probeSession().then(user => {
      if (!ignore) setIsLoggedIn(!!user);
    });
    return () => { ignore = true; };
  }, []);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = FEATURE_DATA.map((item, i) => ({
    ...item,
    title: t(`recruiter.feature${i + 1}Title`),
    desc: t(`recruiter.feature${i + 1}Desc`),
  }));

  const steps = STEP_STYLES.map((item, i) => ({
    ...item,
    title: t(`recruiter.how${i + 1}Title`),
    desc: t(`recruiter.how${i + 1}Desc`),
  }));

  const useCases = USE_CASE_EMOJIS.map((emoji, i) => ({
    emoji,
    label: t(`recruiter.useCase${i + 1}`),
  }));

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src={LOGO_SRC} alt="ThreeDocsy logo" className="h-9 w-auto" />
              <span className="text-xl font-bold text-gray-900">{t('recruiter.navBrand')}</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageDropdown />
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('recruiter.backToMain')}
              </button>
              {isLoggedIn ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  {t('landing.myAccount')}
                </button>
              ) : (
                <button
                  onClick={scrollToDemo}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  {t('recruiter.ctaTryDemo')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50 pt-20 pb-24">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full opacity-20 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-4 px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
            {t('recruiter.heroTag')}
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            {t('recruiter.heroTitle1')}{' '}
            <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
              {t('recruiter.heroTitle2')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('recruiter.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={scrollToDemo}
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
            >
              {t('recruiter.ctaTryDemo')}
            </button>
            <button
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/guest')}
              className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-teal-400 hover:text-teal-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {t('recruiter.ctaLearnMore')}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {[
              t('recruiter.trustFast'),
              t('recruiter.trustNoInstall'),
              t('recruiter.trustInteractive'),
              t('recruiter.trustShare'),
              t('recruiter.trustAnyDevice'),
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-4 py-1.5 bg-red-900/40 text-red-300 text-sm font-semibold rounded-full">
              {t('recruiter.problemTag')}
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              {t('recruiter.problemTitle')}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('recruiter.problemSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-red-900/40 border border-red-700/40 rounded-xl flex items-center justify-center text-red-400 mb-5">
                  {PROBLEM_ICONS[i]}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{t(`recruiter.problem${i + 1}Title`)}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t(`recruiter.problem${i + 1}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution / Features ──────────────────────────────────────────── */}
      <section className="py-24 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
              {t('recruiter.solutionTag')}
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('recruiter.solutionTitle')}
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t('recruiter.solutionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center text-2xl mb-5 shadow-md group-hover:scale-105 transition-transform`}>
                  {f.emoji}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-teal-50 to-emerald-50" id="how-it-works">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
              {t('recruiter.howTag')}
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('recruiter.howTitle')}
            </h2>
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

      {/* ── Demo ─────────────────────────────────────────────────────────── */}
      <section ref={demoRef} className="py-24 bg-white" id="demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block mb-3 px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
              {t('recruiter.demoTag')}
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('recruiter.demoTitle')}
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t('recruiter.demoSubtitle')}
            </p>
          </div>

          {/* Demo iframe — preview mode only, no editor panels */}
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50" style={{ height: '700px' }}>
            <iframe
              src="/demo-preview"
              title="ThreeDocsy interactive demo"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            />
          </div>
        </div>
      </section>

      {/* ── Why it works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-3 px-4 py-1.5 bg-teal-400/15 text-teal-300 text-sm font-semibold rounded-full">
            {t('recruiter.benefitsTag')}
          </span>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            {t('recruiter.benefitsTitle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {WHY_CARD_STYLES.map((style, i) => (
              <div key={i} className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors overflow-hidden text-left">
                <div className={`w-12 h-12 bg-gradient-to-br ${style.gradient} rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg`}>
                  {['🧠', '📌', '🔗'][i]}
                </div>
                <h3 className={`${style.textColor} font-bold text-lg mb-3`}>{t(`recruiter.why${i + 1}Title`)}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t(`recruiter.why${i + 1}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block mb-3 px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
              {t('recruiter.useCasesTag')}
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('recruiter.useCasesTitle')}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {useCases.map((u) => (
              <div
                key={u.label}
                className="flex items-center gap-3 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-700 font-medium hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
              >
                <span className="text-xl">{u.emoji}</span>
                {u.label}
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-16 bg-gradient-to-r from-teal-600 to-emerald-700 rounded-3xl p-10 text-center text-white shadow-2xl">
            <p className="text-2xl font-semibold mb-2 leading-snug">
              {t('recruiter.testimonialQuote')}
            </p>
            <p className="text-teal-200 text-sm mt-4">{t('recruiter.testimonialAuthor')}</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-4 px-4 py-1.5 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
            {t('recruiter.ctaFinalTag')}
          </span>
          <img src={LOGO_SRC} alt="ThreeDocsy logo" className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            {t('recruiter.ctaFinalTitle')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('recruiter.ctaFinalSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
              >
                {t('landing.goToDashboard')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/guest')}
                  className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  {t('recruiter.ctaTryFree')}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-10 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-teal-400 hover:text-teal-600 rounded-2xl shadow-lg transition-all"
                >
                  {t('recruiter.ctaHaveAccount')}
                </button>
              </>
            )}
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
            {t('recruiter.footerCopyright', { year: String(new Date().getFullYear()) })}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RecruiterLandingPage;
