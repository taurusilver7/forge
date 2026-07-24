# Bootstrap — Forge from Scratch

Step-by-step to recreate the Forge project environment.

> **Note:** Forge is already set up. This file exists so any agent understands
> the full dependency and configuration landscape.

## Stack Baseline

| Concern         | Choice          | Version constraint         |
| --------------- | --------------- | -------------------------- |
| Framework       | Next.js         | `^16.2.1`                  |
| Language        | TypeScript      | `^5` (strict mode)         |
| CSS             | Tailwind CSS    | `^3.3.0` + `tailwindcss-animate` |
| UI primitives   | shadcn/ui       | Radix-based, New York style |
| Auth            | Clerk           | `@clerk/nextjs ^7.0.8`    |
| Database ORM    | Prisma          | `@prisma/client ^5.15.0`  |
| Form state      | React Hook Form | `^7.51.5`                  |
| Validation      | Zod             | `^3.23.8`                  |
| Drag & drop     | @dnd-kit/core   | `^6.1.0`                   |
| Icons           | @radix-ui/react-icons | `^1.3.0`           |
| Date formatting | date-fns        | `^4.1.0`                   |

## Step 1 — Create Next.js Project

```bash
npm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

## Step 2 — Install Core Dependencies

```bash
npm install @clerk/nextjs @dnd-kit/core @hookform/resolvers @prisma/client
npm install @radix-ui/react-alert-dialog @radix-ui/react-checkbox @radix-ui/react-dialog
npm install @radix-ui/react-icons @radix-ui/react-label @radix-ui/react-popover
npm install @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider
npm install @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast
npm install @vercel/analytics class-variance-authority clsx date-fns lucide-react
npm install next-themes react-confetti react-day-picker react-hook-form tailwind-merge zod
```

```bash
npm install --save-dev @types/node @types/react @types/react-dom autoprefixer
npm install --save-dev eslint eslint-config-next postcss prisma tailwindcss typescript
```

## Step 3 — Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
```

Add models to `prisma/schema.prisma`:

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql", url = env("DATABASE_URL") }

model Form {
  id            String           @id @default(uuid())
  userId        String
  published     Boolean          @default(false)
  name          String
  description   String           @default("")
  content       String           @default("[]")
  visits        Int              @default(0)
  submissions   Int              @default(0)
  shareURL      String           @unique @default(uuid())
  FormSubmission FormSubmission[]
  createdAt     DateTime         @default(now())
}

model FormSubmission {
  id        String   @id @default(uuid())
  formId    String
  form      Form     @relation(fields: [formId], references: [id])
  content   String
  createdAt DateTime @default(now())
}
```

```bash
npx prisma db push
```

## Step 4 — Initialize shadcn/ui

```bash
npx shadcn@latest init
```
- Style: Default (New York). CSS variables: Yes. Server Components: Yes.
- Import aliases: `@/components`, `@/lib`, `@/hooks`

Then add primitives:
```bash
npx shadcn@latest add button card dialog input tabs textarea scroll-area select switch dropdown-menu avatar badge separator tooltip table checkbox label toast
```

## Step 5 — Set Up Clerk Auth

Create `proxy.ts` at root with:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)", "/sign-up(.*)", "/submit/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

Create auth pages in `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and
`app/(auth)/sign-up/[[...sign-up]]/page.tsx` rendering Clerk's `<SignIn />`
and `<SignUp />` components.

## Step 6 — Set Up Root Layout

Wrap `ClerkProvider` > `ThemeProvider` (next-themes) in `app/layout.tsx`.
Add `<Toaster />` for toast notifications. `DesignerContextProvider` goes
in `app/(dashboard)/builder/[id]/layout.tsx`, NOT in root layout.

## Step 7 — Create Directory Structure

```bash
mkdir -p actions app/\(dashboard)/builder/\[id\]/_components
mkdir -p app/\(dashboard)/form/\[id\]/_components
mkdir -p app/submit/\[formUrl\] app/\(auth)/sign-in/\[\[...sign-in\]\]
mkdir -p app/\(auth)/sign-up/\[\[...sign-up\]\]
mkdir -p components/context components/fields components/ui lib
```

## Step 8 — Create `.env`

```env
DATABASE_URL=postgresql://user:password@host:5432/forge
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
```

## Step 9 — Verify

```bash
npm run build
```

Build must pass with zero errors.
