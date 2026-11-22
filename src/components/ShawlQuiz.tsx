"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackCustom } from "@/lib/track";
import { type QuizAnswers, type QuizModel, quizSteps, rankQuiz } from "@/lib/quiz";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";

const ANY = "__any";

/**
 * One question per screen, three pieces at the end. The questions and the scoring live in lib/quiz.ts; this only
 * walks through them. Tapping an answer moves on; Back keeps what was chosen.
 */
export function ShawlQuiz({ model }: { model: QuizModel }) {
  const steps = quizSteps(model);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const done = step >= steps.length;
  const outcome = useMemo(() => (done ? rankQuiz(model, answers) : null), [done, model, answers]);

  // Move keyboard / screen-reader focus to the new screen's heading.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const pick = (id: string) => {
    const kind = steps[step];
    const next = { ...answers, [kind === "color" ? "color" : kind === "budget" ? "budget" : "occasion"]: id === ANY ? undefined : id };
    setAnswers(next);
    if (step === steps.length - 1) {
      const r = rankQuiz(model, next);
      trackCustom("QuizCompleted", {
        occasion: model.occasion?.options.find((o) => o.id === next.occasion)?.label ?? "any",
        color: model.colors?.find((c) => c.key === next.color)?.label ?? "any",
        budget: model.bands?.find((b) => b.id === next.budget)?.label ?? "any",
        results: r.results.length,
        content_ids: r.results.map((x) => x.slug),
      });
    }
    setStep(step + 1);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <section className="container-page mx-auto flex min-h-[calc(100svh-9.5rem)] max-w-xl flex-col py-5 md:min-h-0 md:py-14" aria-live="polite">
      <p className="eyebrow">Find your shawl</p>
      {!done ? (
        <>
          <div className="mt-3 flex items-center gap-3" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            Question {step + 1} of {steps.length}
          </p>
          <Question key={steps[step]} kind={steps[step]} model={model} selected={answers[steps[step]]} onPick={pick} heading={heading} />
          <div className="mt-auto flex items-center pt-5">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex h-11 items-center text-sm underline underline-offset-4">
                Back
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <Results model={model} answers={answers} outcome={outcome!} heading={heading} onBack={() => setStep(steps.length - 1)} onRestart={restart} />
      )}
    </section>
  );
}

function Question({
  kind,
  model,
  selected,
  onPick,
  heading,
}: {
  kind: "occasion" | "color" | "budget";
  model: QuizModel;
  selected?: string;
  onPick: (id: string) => void;
  heading: React.Ref<HTMLHeadingElement>;
}) {
  const title = kind === "occasion" ? model.occasion!.question : kind === "color" ? "Which color draws you in?" : "What would you like to spend?";
  const options: { id: string; label: string; hex?: string }[] =
    kind === "occasion"
      ? model.occasion!.options
      : kind === "color"
        ? model.colors!.map((c) => ({ id: c.key, label: c.label, hex: c.hex }))
        : model.bands!.map((b) => ({ id: b.id, label: b.label }));
  const all = [...options, { id: ANY, label: kind === "budget" ? "Any budget" : kind === "color" ? "Any color" : "Not sure yet", hex: undefined }];
  // Selected "any" is remembered as no answer, so show it highlighted when nothing was picked on a revisit.
  return (
    <div className="mt-4">
      <h1 ref={heading} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
        {title}
      </h1>
      <div role="radiogroup" aria-label={title} className={`mt-5 grid gap-2.5 ${all.length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
        {all.map((o) => {
          const on = o.id === ANY ? false : selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(o.id)}
              className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left text-[0.95rem] transition ${
                on ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink"
              } ${o.id === ANY ? "text-muted" : ""}`}
            >
              {o.hex && (
                <span
                  aria-hidden="true"
                  className="size-5 shrink-0 rounded-full border border-black/15"
                  style={{ background: o.hex }}
                />
              )}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Results({
  model,
  answers,
  outcome,
  heading,
  onBack,
  onRestart,
}: {
  model: QuizModel;
  answers: QuizAnswers;
  outcome: ReturnType<typeof rankQuiz>;
  heading: React.Ref<HTMLHeadingElement>;
  onBack: () => void;
  onRestart: () => void;
}) {
  const { results, seeAllHref } = outcome;
  const asked = Boolean(answers.occasion || answers.color || answers.budget);
  return (
    <div className="mt-3">
      <h1 ref={heading} tabIndex={-1} className="font-display text-3xl leading-tight outline-none md:text-4xl">
        {results.length ? (asked ? "Our picks for you" : "A few pieces to start with") : "Nothing matches that exactly"}
      </h1>
      {results.length === 0 && (
        <p className="mt-3 text-muted">
          We couldn&apos;t find a piece in stock for those answers{model.bands && answers.budget ? ". Try a different budget, or see everything we have" : ". See everything we have"}.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/product/${r.slug}${r.optionId ? `?option=${encodeURIComponent(r.optionId)}` : ""}`}
              className="group flex gap-3 rounded-xl border border-line bg-white p-2.5 transition hover:border-ink"
            >
              <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-sand sm:w-24">
                <ProductImage image={r.image} sizes="96px" />
              </div>
              <div className="min-w-0 py-0.5">
                <h2 className="font-sans text-[0.95rem] leading-snug group-hover:text-accent">{r.title}</h2>
                <Price price={r.price} compareAt={r.compareAt} className="mt-0.5 text-[0.95rem] font-medium" />
                <p className="mt-1 text-sm leading-snug text-muted">{r.why}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link href={seeAllHref} className="btn btn-outline">
          {results.length ? "See all matching pieces" : "See everything"}
        </Link>
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center text-sm underline underline-offset-4">
          Back
        </button>
        <button type="button" onClick={onRestart} className="inline-flex h-11 items-center text-sm underline underline-offset-4">
          Start over
        </button>
      </div>
    </div>
  );
}
