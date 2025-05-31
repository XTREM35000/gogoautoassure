import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function VerifyEmailPage() {
  const location = useLocation();
  const email = location.state?.email;
  const message = location.state?.message || 'Vérifiez votre email pour activer votre compte';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col justify-center w-full px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div className="flex items-center mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gradient-primary">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">
              Gogo AutoAssure
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm">
            <CheckCircle className="w-16 h-16 mb-4 text-teal-500" />
            <h2 className="mb-2 text-2xl font-bold text-center">
              Vérifiez votre email
            </h2>
            <p className="mb-6 text-center text-gray-600">
              {message}
              {email && (
                <>
                  <br />
                  <span className="font-medium">{email}</span>
                </>
              )}
            </p>
            <div className="w-full space-y-4">
              <Link to="/login">
                <Button className="w-full" variant="outline">
                  Retour à la connexion
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden w-0 lg:block lg:w-1/2 xl:w-3/5">
        <div className="absolute inset-0 object-cover w-full h-full bg-gradient-primary">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col items-center justify-center h-full text-white"
          >
            <h2 className="mb-4 text-3xl font-bold text-center">
              Bienvenue chez G3A
            </h2>
            <p className="max-w-md text-lg text-center">
              Votre compte est presque prêt. Vérifiez votre email pour commencer à gérer vos assurances auto en toute simplicité.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}