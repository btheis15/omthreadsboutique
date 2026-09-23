import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  description: "About, FAQ, Care guide and policy pages.",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Page",
      type: "slug",
      description:
        "Use about, faq, care-guide, shipping, returns, privacy or terms to replace the built-in pages.",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "intro", title: "Intro", type: "text", rows: 2 }),
    defineField({
      name: "body",
      title: "Content",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true }, fields: [{ name: "alt", type: "string", title: "Alt text" }] }],
    }),
  ],
});
