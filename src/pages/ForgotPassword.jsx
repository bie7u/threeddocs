import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
    } catch {
      // Silently ignore errors to prevent email enumeration
    } finally {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full space-y-6 p-10 bg-white rounded-2xl shadow-2xl">
        <div className="flex justify-center">
          <img src="/logo.svg" alt="ThreeDocsy logo" className="h-16 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Resetowanie hasła
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Podaj swój adres e-mail, a wyślemy Ci link do resetowania hasła.
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
            Link do resetowania hasła został wysłany na podany adres e-mail.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adres e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                placeholder="Wpisz adres e-mail"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Wysyłanie…' : 'Wyślij link resetujący'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Wróć do logowania
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
