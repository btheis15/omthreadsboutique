"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

const SINGLETONS = new Set(["siteSettings"]);

export default defineConfig({
  name: "omthreads",
  title: "Om Threads Boutique",
  basePath: "/studio",
  projectId: projectId || "missing-project-id",
  dataset,
  schema: {
    types: schemaTypes,
    // Settings is a single document; hide it from "create new".
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.has(schemaType)),
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Om Threads")
          .items([
            S.documentTypeListItem("product").title("Products"),
            S.documentTypeListItem("collection").title("Collections"),
            S.documentTypeListItem("testimonial").title("Customer reviews"),
            S.documentTypeListItem("page").title("Pages"),
            S.divider(),
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.documentTypeListItem("submission").title("Inbox (messages & sign-ups)"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    newDocumentOptions: (prev) =>
      prev.filter((t) => ["product", "collection", "page", "testimonial"].includes(t.templateId)),
    actions: (prev, { schemaType }) =>
      SINGLETONS.has(schemaType)
        ? prev.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : prev,
  },
});
