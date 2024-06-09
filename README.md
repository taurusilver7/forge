# Forge - Form Generator

> Explore the state-of-art Custom Form Building SaaS built with Next 14, Typescript, PostgreSQL, and Prisma.

![forge-form-builder](https://i.ibb.co/H21t7RB/forge.png)

## Features

-  Fully responsive: mobile & tablet 💻
-  Create forms with a stunning drag and drop designer.
-  Layout fields: Title, Subtitle, Spacer, Separator, Paragraph. ⬅➡↕
-  Form fields: Text, Number, Select, Date, Checkbox, Textarea.
-  Add and customize new fields. 📌
-  Form preview dialog. 📃
-  Share form urls. 🔘
-  Form submission/validation.
-  👍🏻 Form stats: visits and submissions.

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

Enable the server actions in next configuration. Server actions replace the backend REST API's in full-stack development.

Create a GetFormStat server action to aggregate the user visits & form submission to the status. Calculate the submission rate against the user visits & bouce rates for the status info.

Create a server action `form.ts` and follow the [document](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices#solution) to setup Instantiating prismaClient with Next.js.

Create a create-form-button component to create a default form in the dashboard. Create a server function to create a form with form data from UI.

Create a schema directory for all the input validation schema & types. Create a server action CreateForm to store a new form with input entry values in the database.

Style the create-form-button & dashboard page. Create a form-cards component to map the forms to display as summary in the dashboard. Populate each form in FormCard component.

Create a server action to filter out all the form created by the specific user id (logged user).

Each form card either leads to the published form (if the form was published) or builder portal to edit/modify the custom form-template.

## Builder

Create a builder/[id] route in the dashboard route-group. The user will be routed to the builder portal to create the form from ground-up.

Create a server action to find the form data from the params in the url (formId). Populate the form information in FormBuilder component.

Create a layout, error & loading for the builder route for smooth UI experience.

Design the form-builder with functional buttons to build & a main form editor. Create a designer component that acts as main form editor display.

Add [dnd-kit](https://dndkit.com/) to add drag-drop functions to the designer. Wrap the form-builder with DndContext to use the drag-drop feature in the designer.

The designer has the dropzone & desgin sidebar. The sidebar has created form elements. Each element has another property sidebar component to customize the form element.

Create form-elements, a collective elements components for all the form elements (text, heading, paragraph, Number field, textarea.,). Create a type for the elements going to be used in the form, formElementType.

Create multiple form elements (that are either textfields or numberfields), each with properties of FormElement, to be used as multiple input elements in form builder.

Create a SidebarBtnElement that populates each FormElement in the builder designer sidebar. Use dnd-kit to make the sidebarBtnElement draggable to the designer space.

Create a drag-overlay beneath the Designer to render the drag elements in the designer. To check if there are dragged elements to render, create a custom hook to monitor drag operations like onDragStart event listeners.

Use a state in Designer to stall the dragged element from sidebar in the designer. However, this dragged element must be rendered in preview page too. A context menu is preferred to state.

Wrap the root layout with designer context provider to let the state(values) available to all the components.

Listen to the onDragEnd event in designer, and call addElement from the custom hook to add the dragged element to the elements list in context.

Every child component can use the dnd-monitor, as long the parent/root component was wrapped by the DndContext. With the useDndMonitor & onDragEnd event, find the dragged element and add to the list of elements.

Map through the added elements to render them in the designer. For each form element (Text field, Number field), style the designer component to render them in designer workspace.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

1. form-builder

-  preview dialog btn
-  publish form btn
-  save form btn

-  drag-overlay-wrapper
-  designer (designer-sidebar)

forms - published-forms

-  form link share
-  visit btn
-  form-elements

submit route

form-elements
form-submit component

common
form-element (& every component that has form element)
form element sidebar
sidebar btn element
properties from sidebar
