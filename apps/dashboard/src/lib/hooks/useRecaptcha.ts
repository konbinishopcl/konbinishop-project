'use client';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useState } from 'react';

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyRecaptcha = async (action: string): Promise<string> => {
    if (!executeRecaptcha) {
      throw new Error('reCAPTCHA not loaded');
    }

    setIsVerifying(true);
    try {
      const token = await executeRecaptcha(action);
      return token;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyRecaptcha,
    isVerifying,
  };
}
