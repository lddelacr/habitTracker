import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginPage onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupPage onSwitchToLogin={() => setIsLogin(true)} />
  );
};