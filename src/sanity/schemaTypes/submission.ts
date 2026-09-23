import { defineField, defineType } from "sanity";

/** Contact-form messages and newsletter sign-ups, created by the website. */
export const submission = defineType({
  name: "submission",
  title: "Inbox",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Message", value: "message" },
          { title: "Newsletter sign-up", value: "newsletter" },
        ],
      },
    }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "message", type: "text" }),
    defineField({ name: "submittedAt", title: "Received", type: "datetime" }),
  ],
  orderings: [{ title: "Newest", name: "newest", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", email: "email", kind: "kind", message: "message" },
    prepare: ({ name, email, kind, message }) => ({
      title: kind === "newsletter" ? `✉︎ ${email}` : `💬 ${name || email}`,
      subtitle: kind === "newsletter" ? "Newsletter sign-up" : message,
    }),
  },
});
