import React from 'react';
import { AuthModal } from '../modals/AuthModal';

interface AuthPageProps {
  mode: 'login' | 'register';
  onClose: () => void;
}

// The route owns this view. AuthModal only supplies the existing authentication form.
export const AuthPage: React.FC<AuthPageProps> = ({ mode, onClose }) => (
  <main className="w-full">
    <AuthModal
      isOpen
      presentation="page"
      initialTab={mode}
      onClose={onClose}
    />
  </main>
);
