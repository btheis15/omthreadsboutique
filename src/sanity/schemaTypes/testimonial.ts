import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Customer review",
  type: "document",
  description: "Copy real reviews (with permission) from Etsy or messages.",
  fields: [
    defineField({ name: "quote", title: "Review", type: "text", rows: 4, validation: (r) => r.required().max(400) }),
    defineField({ name: "name", title: "Customer name", type: "string", description: "e.g. “Priya S.”", validation: (r) => r.required() }),
    defineField({ name: "location", title: "Location (optional)", type: "string" }),
    defineField({ name: "product", title: "What they bought (optional)", type: "string" }),
  ],
  preview: { select: { title: "name", subtitle: "quote" } },
});
