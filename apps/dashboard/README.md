This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Code Quality

This project uses **lint-staged** and **husky** to ensure code quality:

- **Pre-commit hooks** automatically run ESLint on staged files
- **Auto-fix** applies ESLint fixes automatically
- **Git add** stages the fixed files

### Available Scripts

```bash
npm run lint          # Run ESLint
npm run build         # Build the project
npm run dev           # Start development server
```

## Project Structure

```
src/
├── app/
│   ├── login/        # Login page
│   ├── dashboard/    # Protected dashboard
│   └── page.tsx      # Home page
├── components/       # React components
├── lib/
│   ├── stores/       # Zustand stores
│   └── strapi/       # Strapi API integration
└── middleware.ts     # Next.js middleware for auth
```

## Authentication

- **Login only** - Simple authentication flow
- **Strapi backend** - JWT token-based authentication
- **Middleware protection** - Automatic route protection
- **User store** - Zustand state management

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Strapi Configuration
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_TOKEN_COOKIE=strapi_jwt

# Google reCAPTCHA v3
NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

### Getting reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Choose reCAPTCHA v3
4. Add your domain(s)
5. Copy the Site Key to your `.env.local` file

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
