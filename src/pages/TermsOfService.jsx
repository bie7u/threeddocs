import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="ThreeDocsy logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Regulamin korzystania z aplikacji Threedocsy
        </h1>
        <p className="text-center text-sm text-gray-400 mb-8">📄</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§1 Postanowienia ogólne</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Regulamin określa zasady korzystania z aplikacji internetowej „Threedocsy" dostępnej pod adresem [URL].</li>
              <li>Operatorem aplikacji jest osoba fizyczna prowadząca projekt „Threedocsy" (dalej: „Operator").</li>
              <li>Kontakt z Operatorem możliwy jest pod adresem e-mail: [TWÓJ EMAIL].</li>
              <li>Korzystanie z aplikacji oznacza akceptację niniejszego regulaminu.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§2 Konto użytkownika</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Korzystanie z wybranych funkcji aplikacji może wymagać rejestracji.</li>
              <li>Użytkownik zobowiązuje się do podania prawdziwych danych.</li>
              <li>Użytkownik odpowiada za bezpieczeństwo swojego konta.</li>
              <li>Zabronione jest udostępnianie konta osobom trzecim.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§3 Zasady korzystania</h2>
            <p>Użytkownik zobowiązuje się korzystać z aplikacji zgodnie z prawem. Zabronione jest:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>dostarczanie treści nielegalnych,</li>
              <li>podejmowanie prób włamania lub zakłócenia działania,</li>
              <li>wykorzystywanie aplikacji w sposób sprzeczny z jej przeznaczeniem.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§4 Dostępność usługi</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Aplikacja udostępniana jest „tak jak jest" (as is).</li>
              <li>Operator nie gwarantuje ciągłej dostępności aplikacji.</li>
              <li>Operator może wprowadzać zmiany w funkcjonalności w dowolnym czasie.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§5 Odpowiedzialność</h2>
            <p>Operator nie ponosi odpowiedzialności za:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>skutki korzystania z aplikacji przez użytkownika,</li>
              <li>utratę danych,</li>
              <li>przerwy w działaniu usługi.</li>
            </ul>
            <p className="mt-1">Użytkownik korzysta z aplikacji na własne ryzyko.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§6 Usunięcie konta</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Użytkownik może w każdej chwili zaprzestać korzystania z aplikacji.</li>
              <li>Operator może usunąć konto w przypadku naruszenia regulaminu.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§7 Dane osobowe</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Dane użytkowników mogą być przetwarzane w zakresie niezbędnym do działania aplikacji.</li>
              <li>Dane są przetwarzane zgodnie z RODO.</li>
              <li>Szczegóły znajdują się w Polityce prywatności.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§8 Postanowienia końcowe</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Regulamin może być zmieniany w dowolnym czasie.</li>
              <li>Dalsze korzystanie z aplikacji oznacza akceptację zmian.</li>
            </ol>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/register"
            className="inline-block font-medium text-blue-600 hover:text-blue-500 text-sm"
          >
            ← Wróć do rejestracji
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
