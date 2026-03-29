import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="ThreeDocsy logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Polityka prywatności – Threedocsy
        </h1>
        <p className="text-center text-sm text-gray-400 mb-8">🔒</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§1 Informacje ogólne</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Niniejsza polityka prywatności określa zasady przetwarzania danych użytkowników aplikacji „Threedocsy".</li>
              <li>Administratorem danych jest osoba fizyczna prowadząca projekt „Threedocsy" (dalej: „Administrator").</li>
              <li>Kontakt z Administratorem: [TWÓJ EMAIL].</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§2 Zakres zbieranych danych</h2>
            <p>Administrator może zbierać następujące dane:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>adres e-mail,</li>
              <li>dane podane przy rejestracji,</li>
              <li>adres IP,</li>
              <li>dane techniczne (np. przeglądarka, urządzenie).</li>
            </ul>
            <p className="mt-1">Dane są zbierane wyłącznie w zakresie niezbędnym do działania aplikacji.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§3 Cel przetwarzania danych</h2>
            <p>Dane są przetwarzane w celu:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>utworzenia i obsługi konta użytkownika,</li>
              <li>zapewnienia działania aplikacji,</li>
              <li>poprawy funkcjonowania i bezpieczeństwa serwisu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§4 Podstawa prawna</h2>
            <p>Dane przetwarzane są zgodnie z RODO na podstawie:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>zgody użytkownika (rejestracja),</li>
              <li>niezbędności do wykonania usługi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§5 Przechowywanie danych</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Dane są przechowywane przez czas korzystania z aplikacji.</li>
              <li>Po usunięciu konta dane mogą zostać usunięte lub zanonimizowane.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§6 Prawa użytkownika</h2>
            <p>Użytkownik ma prawo do:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>dostępu do swoich danych,</li>
              <li>ich poprawiania,</li>
              <li>usunięcia danych,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>wniesienia sprzeciwu.</li>
            </ul>
            <p className="mt-1">W celu realizacji praw należy skontaktować się z Administratorem.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§7 Udostępnianie danych</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Dane mogą być przekazywane podmiotom technicznym wspierającym działanie aplikacji (np. hosting).</li>
              <li>Dane nie są sprzedawane osobom trzecim.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§8 Pliki cookies</h2>
            <p>Aplikacja może wykorzystywać pliki cookies. Cookies służą do:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-4">
              <li>utrzymania sesji użytkownika,</li>
              <li>poprawy działania aplikacji.</li>
            </ul>
            <p className="mt-1">Użytkownik może zarządzać cookies w ustawieniach przeglądarki.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§9 Zabezpieczenia</h2>
            <p>Administrator stosuje odpowiednie środki techniczne i organizacyjne w celu ochrony danych.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">§10 Zmiany polityki</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Polityka prywatności może być aktualizowana.</li>
              <li>Zmiany wchodzą w życie po ich opublikowaniu.</li>
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

export default PrivacyPolicy;
