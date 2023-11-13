# Forge

> Explore the state-of-art Custom Form Building SaaS built with Next 14, Typescript, PostgreSQL, and Prisma.

## Getting Started

First, run the development server:

```bash
npx create-next-app@latest <name> --typescript --tailwind --eslint
# and
npm run dev
# or
yarn dev
```

## Build

Setup clerk authentication and create a clerk project. Get the public & secret key as environment variables.

Refactor the main `layout` in `app` directory. Add the ClerkProvider as wrapper around the layout.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
