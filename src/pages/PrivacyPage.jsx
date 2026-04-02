import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const PrivacyPolicy = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="ThreeDocsy logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {t('privacy.title')}
        </h1>
        <p className="text-center text-sm text-gray-400 mb-8">🔒</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s1Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('privacy.s1p1')}</li>
              <li>{t('privacy.s1p2')}</li>
              <li>{t('privacy.s1p3')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s2Title')}</h2>
            <p>{t('privacy.s2intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('privacy.s2item1')}</li>
              <li>{t('privacy.s2item2')}</li>
              <li>{t('privacy.s2item3')}</li>
              <li>{t('privacy.s2item4')}</li>
            </ul>
            <p className="mt-1">{t('privacy.s2outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s3Title')}</h2>
            <p>{t('privacy.s3intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('privacy.s3item1')}</li>
              <li>{t('privacy.s3item2')}</li>
              <li>{t('privacy.s3item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s4Title')}</h2>
            <p>{t('privacy.s4intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('privacy.s4item1')}</li>
              <li>{t('privacy.s4item2')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s5Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('privacy.s5p1')}</li>
              <li>{t('privacy.s5p2')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s6Title')}</h2>
            <p>{t('privacy.s6intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('privacy.s6item1')}</li>
              <li>{t('privacy.s6item2')}</li>
              <li>{t('privacy.s6item3')}</li>
              <li>{t('privacy.s6item4')}</li>
              <li>{t('privacy.s6item5')}</li>
            </ul>
            <p className="mt-1">{t('privacy.s6outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s7Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('privacy.s7p1')}</li>
              <li>{t('privacy.s7p2')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s8Title')}</h2>
            <p>{t('privacy.s8intro')}</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>{t('privacy.s8item1')}</li>
              <li>{t('privacy.s8item2')}</li>
            </ul>
            <p className="mt-1">{t('privacy.s8outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s9Title')}</h2>
            <p>{t('privacy.s9p1')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.s10Title')}</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('privacy.s10p1')}</li>
              <li>{t('privacy.s10p2')}</li>
            </ol>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/register"
            className="inline-block font-medium text-blue-600 hover:text-blue-500 text-sm"
          >
            {t('privacy.backToRegister')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
