'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface RecaptchaProviderProps {
  children: React.ReactNode;
}

export default function RecaptchaProvider({
  children,
}: RecaptchaProviderProps) {
  const siteKey = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn('Google reCAPTCHA site key not found');
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: 'body',
        nonce: undefined,
      }}
      useEnterprise={false}
      useRecaptchaNet={false}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
