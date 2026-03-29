import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { probeSession, logout } from '../services/auth';
import { API_BASE } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageDropdown } from '../i18n/LanguageDropdown';

const LOGO_SRC = '/logo.svg';

const FEATURE_ICONS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    gradient: 'from-pink-500 to-rose-600',
  },
];

const STEP_STYLES = [
  { num: '01', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { num: '02', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { num: '03', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
];

const USE_CASE_EMOJIS = ['🖥️', '💡', '🚀', '📋', '🔐', '🔄', '🧩', '🎯'];

const StatCard = ({ value, label, textColor, gradientFrom, note }) => (
  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors overflow-hidden">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom}/10 to-transparent rounded-2xl pointer-events-none`} />
    <div className="relative">
      <div className="text-6xl font-black text-white mb-1 tabular-nums">
        {value !== null ? value : <span className="animate-pulse text-gray-600">—</span>}
      </div>
      <div className={`${textColor} font-semibold text-lg mb-2`}>{label}</div>
      <div className="text-gray-500 text-sm">{note}</div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let ignore = false;
    probeSession().then(user => {
      if (!ignore) setIsLoggedIn(!!user);
    });
    fetch(`${API_BASE}/user_counter`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!ignore && data) setStats(data); })
      .catch(() => {});
    return () => { ignore = true; };
  }, []); // run once on mount

  const handleLogout = async () => {
    await logout().catch(() => {});
    setIsLoggedIn(false);
  };

  const features = FEATURE_ICONS.map((item, i) => ({
    ...item,
    title: t(`landing.feature${i + 1}Title`),
    desc: t(`landing.feature${i + 1}Desc`),
  }));

  const steps = STEP_STYLES.map((item, i) => ({
    ...item,
    title: t(`landing.how${i + 1}Title`),
    desc: t(`landing.how${i + 1}Desc`),
  }));

  const useCases = USE_CASE_EMOJIS.map((emoji, i) => ({
    emoji,
    label: t(`landing.useCase${i + 1}`),
  }));

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
              <LanguageDropdown />
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {t('landing.myAccount')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {t('landing.login')}
                  </button>
                  <button
                    onClick={() => navigate('/guest')}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    {t('landing.tryFree')}
                  </button>
                </>
              )}
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
            {t('landing.heroTag')}
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            {t('landing.heroTitle1')}{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {t('landing.heroTitle2')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroSubtitleFull')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  {t('landing.goToDashboard')}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/guest')}
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  {t('landing.ctaFreeNoReg')}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  {t('landing.hasAccount')}
                </button>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {[
              t('landing.trustNoReg'),
              t('landing.trustForIT'),
              t('landing.trustShareLinks'),
              t('landing.trustBrowser'),
              t('landing.trustInteractive'),
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why interactive learning works ───────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block mb-3 px-4 py-1.5 bg-purple-900/50 text-purple-300 text-sm font-semibold rounded-full">
              {t('landing.sectionTagLearning')}
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              {t('landing.whyTitle')}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('landing.whySubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                🧠
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{t('landing.activeExploration')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.card1DescPre')}{' '}
                <span className="text-blue-400 font-semibold">
                  {t('landing.card1DescHighlight')}
                </span>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                📌
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{t('landing.oneStepOneInfo')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.card2DescPre')}
                {' '}
                <span className="text-green-400 font-semibold">
                  {t('landing.card2DescHighlight')}
                </span>{' '}
                {t('landing.card2DescPost')}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">
                🎯
              </div>
              <h3 className="text-white font-bold text-xl mb-3">{t('landing.threeDEngages')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('landing.card3DescPre')}{' '}
                <span className="text-purple-400 font-semibold">
                  {t('landing.card3DescHighlight')}
                </span>{' '}
                {t('landing.card3DescPost')}
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
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
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
              {t('landing.howTitle')}
            </h2>
            <p className="text-xl text-gray-500">
              {t('landing.howSubtitle')}
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
              {t('landing.forWhoTitle')}
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t('landing.forWhoSubtitle')}
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
              {t('landing.testimonialQuote')}
            </p>
            <p className="text-blue-200 text-sm mt-4">{t('landing.testimonialAuthor')}</p>
          </div>
        </div>
      </section>

      {/* ── Community Transparency Stats ─────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-3 px-4 py-1.5 bg-yellow-400/15 text-yellow-300 text-sm font-semibold rounded-full">
            {t('landing.statsTag')}
          </span>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            {t('landing.statsTitle')}{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              {t('landing.statsHighlight')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-14">
            {t('landing.statsSubtitle')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <StatCard
              value={stats !== null ? stats.users_count : null}
              label={t('landing.statsUsers')}
              textColor="text-blue-300"
              gradientFrom="from-blue-600"
              note={
                <span>
                  {t('landing.statsNote1Pre')}{' '}
                  <span className="text-blue-400 font-semibold">
                    {stats !== null && stats.users_count > 0
                      ? t('landing.statsNote1Vote', { count: stats.users_count })
                      : t('landing.statsNote1Real')}
                  </span>{' '}
                  {t('landing.statsNote1Post')}
                </span>
              }
            />
            <StatCard
              value={stats !== null ? stats.projects_count : null}
              label={t('landing.statsModels')}
              textColor="text-purple-300"
              gradientFrom="from-purple-600"
              note={
                <span>
                  {t('landing.statsNote2Pre')}{' '}
                  <span className="text-purple-400 font-semibold">{t('landing.statsNote2Highlight')}</span>
                </span>
              }
            />
            <StatCard
              value={stats !== null ? stats.project_shared_count : null}
              label={t('landing.statsShares')}
              textColor="text-green-300"
              gradientFrom="from-green-600"
              note={
                <span>
                  {t('landing.statsNote3Pre')}{' '}
                  <span className="text-green-400 font-semibold">{t('landing.statsNote3Highlight')}</span>{' '}
                  {t('landing.statsNote3Post')}
                </span>
              }
            />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-left max-w-2xl mx-auto">
            <p className="text-yellow-200 font-semibold mb-2">{t('landing.whyStatsTitle')}</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('landing.whyStatsDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src={LOGO_SRC} alt="ThreeDocsy logo" className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            {t('landing.ctaFinalTitle')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('landing.ctaFinalSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  {t('landing.goToDashboard')}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-10 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-purple-400 hover:text-purple-600 rounded-2xl shadow-lg transition-all"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/guest')}
                  className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  {t('landing.startNowFree')}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-10 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-purple-400 hover:text-purple-600 rounded-2xl shadow-lg transition-all"
                >
                  {t('landing.login')}
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
            {t('landing.footerCopyright', { year: String(new Date().getFullYear()) })}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
