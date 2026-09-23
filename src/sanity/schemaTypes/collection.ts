import { defineField, defineType } from "sanity";

export const collection = defineType({
  name: "collection",
  title: "Collection",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "image",
      title: "Cover photo (optional)",
      type: "image",
      description: "If empty, the first product's photo is used.",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Short description of the photo", type: "string" })],
    }),
    defineField({
      name: "showOnHome",
      title: "Show on home page",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: { select: { title: "title", media: "image", subtitle: "description" } },
});
