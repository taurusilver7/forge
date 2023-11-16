# Forge

> Explore the state-of-art Custom Form Building SaaS built with Next 14, Typescript, PostgreSQL, and Prisma.

![forge-form-builder](https://i.ibb.co/NFnK52M/forge.png)

## Getting Started

First, run the development server:

```bash
npx create-next-app@latest <name> --typescript --tailwind --eslint
# and
npm run dev
# or
yarn dev
```

```bash
npx shadcn-ui@latest init
# and
npx shadcn-ui@latest add <components>
```

## Build

Setup clerk authentication and create a clerk project. Get the public & secret key as environment variables.

Refactor the main `layout` in `app` directory. Add the ClerkProvider as wrapper around the layout.

Create a auth route-group with sign-in & sign-up pages. Follow the [doc](https://clerk.com/docs/references/nextjs/custom-signup-signin-pages) for setting up custom sign-in pages.

Update the environment variables for the sign-in, sign-up paths.

Install [shadcn-ui](https://ui.shadcn.com/docs/installation/next) and configure the components.json.

Create a themeprovider for next-ui light/dark modes. Wrap the layout body with ThemeProvider from next-themes dependency.

Create a dashboard route-group. Customize the layout & main page design & styling.

To switch between themes, create a UI component `ThemeSwitcher` which loads the given set of themes based on the mounted state. Add shadcn-ui custom theme to the stylesheet base layer.

## Prisma + Vercel PostgreSQL database configuration

```bash
npm install prisma --save-dev
# and
npx prisma init
```

Create a postgresql database on Vercel, under the free tier. Under the storage menu, choose the database variant & region.

Follow the instructions for prisma and setup the datasource. Update the prisma schema in the project with database config values. Get the POSTGRES_PRISMA_URL & POSTGRES_URL_NON_POOLING env values.

<!-- TODO The prisma database works even with sqlite database too, despite configured for postgresql -->

Create a Form & FormSubmission relational data models. Connect the Form & FormSubmission with `@relation` tag for id field in the Form to formId in FormSubmission.

Run the Prisma database in local development server. Link the project locally with the following commands.

```bash
npx prisma migrate
# name the migration database
npx prisma studio
```

Enable the server actios in next configuration. Server actions replace the backend REST API's in full-stack development.

Create a server action `form.ts` and follow the [doc](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices#solution) to setup Instantiating prismaClient with Next.js.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
