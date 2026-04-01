import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const TermsOfService = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="ThreeDocsy logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {t('terms.title')}
        </h1>
        <p className="text-center text-sm text-gray-400 mb-8">📄</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s1Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('terms.s1p1')}</li>
              <li>{t('terms.s1p2')}</li>
              <li>{t('terms.s1p3')}</li>
              <li>{t('terms.s1p4')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s2Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('terms.s2p1')}</li>
              <li>{t('terms.s2p2')}</li>
              <li>{t('terms.s2p3')}</li>
              <li>{t('terms.s2p4')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s3Title')}</h2>
            <p>{t('terms.s3intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('terms.s3item1')}</li>
              <li>{t('terms.s3item2')}</li>
              <li>{t('terms.s3item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s4Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('terms.s4p1')}</li>
              <li>{t('terms.s4p2')}</li>
              <li>{t('terms.s4p3')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s5Title')}</h2>
            <p>{t('terms.s5intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('terms.s5item1')}</li>
              <li>{t('terms.s5item2')}</li>
              <li>{t('terms.s5item3')}</li>
            </ul>
            <p className="mt-1">{t('terms.s5outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s6Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('terms.s6p1')}</li>
              <li>{t('terms.s6p2')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s7Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('terms.s7p1')}</li>
              <li>{t('terms.s7p2')}</li>
              <li>{t('terms.s7p3')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.s8Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('terms.s8p1')}</li>
              <li>{t('terms.s8p2')}</li>
            </ol>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/register"
            className="inline-block font-medium text-blue-600 hover:text-blue-500 text-sm"
          >
            {t('terms.backToRegister')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
