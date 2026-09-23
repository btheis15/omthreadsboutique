"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "omthreads",
  title: "Om Threads Boutique",
  basePath: "/studio",
  projectId: projectId || "missing-project-id",
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Shop")
          .items([
            S.documentTypeListItem("product").title("Products"),
            S.documentTypeListItem("collection").title("Collections"),
            S.documentTypeListItem("page").title("Pages"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    // "Duplicate" is built in; this makes new-product creation one tap from the top bar.
    newDocumentOptions: (prev) => prev.filter((t) => ["product", "collection", "page"].includes(t.templateId)),
  },
});
