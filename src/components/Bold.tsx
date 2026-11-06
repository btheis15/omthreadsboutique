import { Fragment } from "react";

/** Text with **double-asterisk** words shown bold (the only markup the editable text supports). */
export function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}
