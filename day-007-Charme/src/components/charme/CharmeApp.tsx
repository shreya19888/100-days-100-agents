"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  CharmePlan,
  Season,
  SkinAnalysis,
  SkinCheckIn,
  TraditionalLensAnswers,
  CharmeIntent,
  ExploreTopic,
} from "@/types";
import { SiteHeader } from "@/components/charme/SiteHeader";
import { Hero } from "@/components/charme/Hero";
import { PhotoUploader } from "@/components/charme/PhotoUploader";
import { AnalysisLoading } from "@/components/charme/AnalysisLoading";
import { SkinStory } from "@/components/charme/SkinStory";
import { IntentPicker } from "@/components/charme/IntentPicker";
import { JustLearn } from "@/components/charme/JustLearn";
import { TwoLenses } from "@/components/charme/TwoLenses";
import { FamilyWisdomInput } from "@/components/charme/FamilyWisdom";
import { KitchenInventoryPicker } from "@/components/charme/KitchenInventory";
import { CharmeInsight } from "@/components/charme/CharmeInsight";
import { RitualPlan } from "@/components/charme/RitualPlan";
import { SkinJourney } from "@/components/charme/SkinJourney";
import { Button, DemoBadge, SafetyFooter, SectionHeading } from "@/components/ui/primitives";
import { DEMO_PROFILE, getDemoSkinAnalysis } from "@/data/demo/persona";
import { compareCheckIns } from "@/lib/charme/compare";
import { loadCharmeState, upsertState } from "@/lib/storage";
import { intentsToGoals, primaryIntent, routeAfterIntents } from "@/lib/charme/intents";

type Step =
  | "landing"
  | "upload"
  | "analyzing"
  | "story"
  | "intent"
  | "just_learn"
  | "lenses"
  | "wisdom"
  | "reasoning"
  | "insight"
  | "ritual"
  | "journey";

const DEFAULT_LENS: TraditionalLensAnswers = {
  heatSensitivity: "medium",
  digestionFeel: "variable",
  energyPattern: "steady",
  climateComfort: "neutral",
  sleepQuality: "mixed",
};

export function CharmeApp() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("landing");
  const [demoMode, setDemoMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<SkinAnalysis | null>(null);
  const [journeyObservation, setJourneyObservation] = useState("");
  const [isRecheck, setIsRecheck] = useState(false);

  const [wisdomText, setWisdomText] = useState("");
  const [wisdomChips, setWisdomChips] = useState<string[]>([]);
  const [taughtBy, setTaughtBy] = useState("");
  const [whenUsed, setWhenUsed] = useState("");
  const [meaning, setMeaning] = useState("");
  const [skinNotes, setSkinNotes] = useState("");
  const [intents, setIntents] = useState<CharmeIntent[]>([]);
  const [personalGoals, setPersonalGoals] = useState<string[]>([]);
  const [exploreTopics, setExploreTopics] = useState<ExploreTopic[]>([]);
  const [kitchen, setKitchen] = useState<string[]>([]);
  const [customKitchen, setCustomKitchen] = useState<string[]>([]);
  const [season, setSeason] = useState<Season | undefined>();
  const [traditionalAnswers, setTraditionalAnswers] = useState<TraditionalLensAnswers>(DEFAULT_LENS);
  const [includeTraditional, setIncludeTraditional] = useState(true);
  const [plan, setPlan] = useState<CharmePlan | null>(null);

  useEffect(() => {
    const saved = loadCharmeState();
    if (saved?.currentAnalysis) setAnalysis(saved.currentAnalysis);
    if (saved?.previousAnalysis) setPreviousAnalysis(saved.previousAnalysis);
    if (saved?.plan) setPlan(saved.plan);
    if (saved?.profile) {
      setWisdomText(saved.profile.familyWisdom.freeText);
      setWisdomChips(saved.profile.familyWisdom.selectedChips);
      setTaughtBy(saved.profile.familyWisdom.taughtBy || "");
      setWhenUsed(saved.profile.familyWisdom.whenUsed || "");
      setMeaning(saved.profile.familyWisdom.meaning || "");
      setSkinNotes(saved.profile.lifestyleNotes || "");
      if (saved.profile.intents?.length) setIntents(saved.profile.intents);
      else if (saved.profile.intent) setIntents([saved.profile.intent]);
      if (saved.profile.personalGoals?.length) setPersonalGoals(saved.profile.personalGoals);
      else if (saved.profile.personalGoal) setPersonalGoals([saved.profile.personalGoal]);
      if (saved.profile.exploreTopics) setExploreTopics(saved.profile.exploreTopics);
      setKitchen(saved.profile.kitchen.ingredients);
      setCustomKitchen(saved.profile.kitchen.customIngredients);
      setSeason(saved.profile.season);
      if (saved.profile.traditionalAnswers) {
        setTraditionalAnswers(saved.profile.traditionalAnswers);
      }
    }

    const requested = searchParams.get("step");
    if (requested === "upload") setStep("upload");

    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => setDemoMode(data.mode !== "real"))
      .catch(() => setDemoMode(true));
  }, [searchParams]);

  const headerStep = useMemo(() => {
    switch (step) {
      case "landing":
        return undefined;
      case "upload":
      case "analyzing":
      case "story":
      case "intent":
      case "just_learn":
        return 0;
      case "lenses":
        return 1;
      case "wisdom":
      case "reasoning":
      case "insight":
        return 2;
      case "ritual":
        return 3;
      case "journey":
        return 4;
      default:
        return 0;
    }
  }, [step]);

  function persist(next: {
    analysis?: SkinAnalysis;
    previous?: SkinAnalysis;
    plan?: CharmePlan;
    checkIn?: SkinCheckIn;
  }) {
    const existing = loadCharmeState();
    const checkIns = existing?.checkIns ? [...existing.checkIns] : [];
    if (next.checkIn) checkIns.push(next.checkIn);
    upsertState({
      currentAnalysis: next.analysis ?? analysis ?? undefined,
      previousAnalysis: next.previous ?? previousAnalysis ?? undefined,
      plan: next.plan ?? plan ?? undefined,
      checkIns,
      profile: {
        familyWisdom: {
          freeText: wisdomText,
          selectedChips: wisdomChips,
          taughtBy: taughtBy || undefined,
          whenUsed: whenUsed || undefined,
          meaning: meaning || undefined,
        },
        kitchen: { ingredients: kitchen, customIngredients: customKitchen },
        season,
        traditionalAnswers: includeTraditional ? traditionalAnswers : undefined,
        lifestyleNotes: skinNotes.trim() || undefined,
        intent: intents.length ? primaryIntent(intents) : undefined,
        intents: intents.length ? intents : undefined,
        personalGoal: personalGoals[0],
        personalGoals: personalGoals.length ? personalGoals : undefined,
        exploreTopics: exploreTopics.length ? exploreTopics : undefined,
        goals: intents.length
          ? intentsToGoals(intents, exploreTopics, personalGoals)
          : undefined,
      },
      selfieDataUrl: previewUrl || undefined,
    });
  }

  async function runAnalysis(nextFile: File, nextPreview: string, recheck = false) {
    setError(null);
    setFile(nextFile);
    setPreviewUrl(nextPreview);
    setStep("analyzing");
    setIsRecheck(recheck);

    try {
      const form = new FormData();
      form.append("image", nextFile);
      if (recheck) form.append("recheck", "true");

      const response = await fetch("/api/skin-analysis", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      const nextAnalysis = data.analysis as SkinAnalysis;
      if (recheck && analysis) {
        const comparison = compareCheckIns(analysis, nextAnalysis);
        setPreviousAnalysis(analysis);
        setAnalysis(nextAnalysis);
        setJourneyObservation(comparison.observation);
        persist({
          analysis: nextAnalysis,
          previous: analysis,
          checkIn: {
            id: `checkin_${Date.now()}`,
            timestamp: new Date().toISOString(),
            analysis: nextAnalysis,
          },
        });
        setStep("journey");
      } else {
        setAnalysis(nextAnalysis);
        persist({
          analysis: nextAnalysis,
          checkIn: {
            id: `checkin_${Date.now()}`,
            timestamp: new Date().toISOString(),
            analysis: nextAnalysis,
          },
        });
        setStep("story");
      }
      if (data.mode === "demo") setDemoMode(true);
      if (data.mode === "real") setDemoMode(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't get a reliable reading from this photo. Try a front-facing photo with even lighting.",
      );
      setStep("upload");
    }
  }

  async function runReasoning() {
    if (!analysis) return;
    setError(null);
    setStep("reasoning");
    try {
      const response = await fetch("/api/charme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          familyWisdom: {
            freeText: wisdomText,
            selectedChips: wisdomChips,
            taughtBy: taughtBy || undefined,
            whenUsed: whenUsed || undefined,
            meaning: meaning || undefined,
          },
          kitchen: { ingredients: kitchen, customIngredients: customKitchen },
          season,
          traditionalAnswers:
            includeTraditional &&
            !(intents.length === 1 && intents[0] === "just_learn")
              ? traditionalAnswers
              : undefined,
          skinNotes: skinNotes.trim() || undefined,
          intent: intents.length ? primaryIntent(intents) : "understand",
          intents: intents.length ? intents : undefined,
          personalGoal: personalGoals.join(" | ") || undefined,
          personalGoals: personalGoals.length ? personalGoals : undefined,
          exploreTopics: exploreTopics.length ? exploreTopics : undefined,
          goals: intents.length
            ? intentsToGoals(intents, exploreTopics, personalGoals)
            : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "CHARME reasoning failed");
      setPlan(data.plan);
      persist({ plan: data.plan, analysis });
      setStep("insight");
    } catch (err) {
      setError(err instanceof Error ? err.message : "CHARME had trouble connecting the dots.");
      setStep("wisdom");
    }
  }

  function loadDemo() {
    const demoAnalysis = getDemoSkinAnalysis();
    setAnalysis(demoAnalysis);
    setWisdomText(DEMO_PROFILE.familyWisdom.freeText);
    setWisdomChips(DEMO_PROFILE.familyWisdom.selectedChips);
    setTaughtBy(DEMO_PROFILE.familyWisdom.taughtBy);
    setWhenUsed(DEMO_PROFILE.familyWisdom.whenUsed);
    setMeaning(DEMO_PROFILE.familyWisdom.meaning);
    setKitchen(DEMO_PROFILE.kitchen.ingredients);
    setCustomKitchen([]);
    setSeason(DEMO_PROFILE.season);
    setTraditionalAnswers(DEMO_PROFILE.traditionalAnswers);
    setIncludeTraditional(true);
    setDemoMode(true);
    setError(null);
    upsertState({
      version: 1,
      currentAnalysis: demoAnalysis,
      checkIns: [
        {
          id: `checkin_${Date.now()}`,
          timestamp: new Date().toISOString(),
          analysis: demoAnalysis,
        },
      ],
      profile: {
        familyWisdom: DEMO_PROFILE.familyWisdom,
        kitchen: DEMO_PROFILE.kitchen,
        season: DEMO_PROFILE.season,
        traditionalAnswers: DEMO_PROFILE.traditionalAnswers,
      },
    });
    setStep("story");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader stepIndex={headerStep} onLoadDemo={loadDemo} showTagline={step === "landing"} />
      <DemoBadge show={demoMode && process.env.NODE_ENV === "development"} />

      {step === "landing" ? (
        <>
          <Hero
            onStart={() => setStep("upload")}
            onHowItWorks={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-20">
            <SectionHeading
              eyebrow="How CHARME works"
              title="Understand first. Change only if you choose."
              subtitle="CHARME doesn't judge your skin. Your skin doesn't need to look like anyone else's."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Skin snapshot",
                  copy: "YouCam reads visible characteristics — hydration, redness, radiance — as observations, not a problem list.",
                },
                {
                  title: "You choose the goal",
                  copy: "Understand, explore a change, build habits, try rituals, or just learn — recommendations follow your intent.",
                },
                {
                  title: "Kitchen + home wisdom",
                  copy: "Indian staples, seasonal rhythm, and ghar ka nuskha (family remedies) — kept, modified, or paused with care.",
                },
              ].map((card) => (
                <article key={card.title} className="charme-card jaali-border rounded-[1.75rem] p-6">
                  <h3 className="font-display text-2xl text-charme-ink">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-charme-muted">{card.copy}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {step === "upload" ? (
        <section className="px-6 py-10">
          <div className="mx-auto mb-8 max-w-3xl">
            <SectionHeading
              eyebrow="Look"
              title="Let's meet your skin."
              subtitle="One clear selfie begins your skin story."
            />
          </div>
          <PhotoUploader onSubmit={(f, url) => runAnalysis(f, url, isRecheck)} />
          {error ? (
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-charme-clay">{error}</p>
          ) : null}
        </section>
      ) : null}

      {step === "analyzing" || step === "reasoning" ? (
        <AnalysisLoading
          label={step === "reasoning" ? "Connecting modern + traditional wisdom" : "Building your skin story"}
        />
      ) : null}

      {step === "story" && analysis ? (
        <SkinStory
          analysis={analysis}
          skinNotes={skinNotes}
          onSkinNotes={setSkinNotes}
          onContinue={() => setStep("intent")}
        />
      ) : null}

      {step === "intent" ? (
        <IntentPicker
          intents={intents}
          personalGoals={personalGoals}
          onToggleIntent={(id) =>
            setIntents((current) =>
              current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
            )
          }
          onTogglePersonalGoal={(goal) =>
            setPersonalGoals((current) =>
              current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal],
            )
          }
          onContinue={() => {
            const route = routeAfterIntents(intents);
            if (route === "just_learn") {
              setIncludeTraditional(false);
              setStep("just_learn");
              return;
            }
            if (route === "wisdom") {
              setIncludeTraditional(false);
              setStep("wisdom");
              return;
            }
            setStep("lenses");
          }}
        />
      ) : null}

      {step === "just_learn" && analysis ? (
        <JustLearn
          analysis={analysis}
          skinNotes={skinNotes}
          exploreTopics={exploreTopics}
          onToggleTopic={(topic) =>
            setExploreTopics((current) =>
              current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic],
            )
          }
          onDone={async () => {
            await runReasoning();
          }}
          onContinueOptional={() => {
            if (exploreTopics.includes("traditional_rituals")) {
              setIncludeTraditional(true);
              setStep("lenses");
              return;
            }
            if (exploreTopics.includes("nutrition") || exploreTopics.length === 0) {
              setStep("wisdom");
              return;
            }
            setStep("wisdom");
          }}
        />
      ) : null}

      {step === "lenses" && analysis ? (
        <TwoLenses
          analysis={analysis}
          answers={traditionalAnswers}
          onChange={setTraditionalAnswers}
          onContinue={() => {
            setIncludeTraditional(true);
            setStep("wisdom");
          }}
          onSkip={() => {
            setIncludeTraditional(false);
            setStep("wisdom");
          }}
        />
      ) : null}

      {step === "wisdom" ? (
        <section className="mx-auto max-w-5xl space-y-6 px-6 py-10 animate-fade-up">
          <SectionHeading
            eyebrow="Nourish + Home wisdom"
            title="Bring your kitchen and your lineage"
            subtitle="Your kitchen is part of your ritual. Your family's remedy isn't automatically wrong."
          />
          <FamilyWisdomInput
            value={wisdomText}
            selectedChips={wisdomChips}
            taughtBy={taughtBy}
            whenUsed={whenUsed}
            meaning={meaning}
            onChange={setWisdomText}
            onTaughtBy={setTaughtBy}
            onWhenUsed={setWhenUsed}
            onMeaning={setMeaning}
            onToggleChip={(chip) =>
              setWisdomChips((current) =>
                current.includes(chip) ? current.filter((c) => c !== chip) : [...current, chip],
              )
            }
          />
          <KitchenInventoryPicker
            selected={kitchen}
            custom={customKitchen}
            season={season}
            onSeason={setSeason}
            onToggle={(item) =>
              setKitchen((current) =>
                current.includes(item) ? current.filter((c) => c !== item) : [...current, item],
              )
            }
            onAddCustom={(item) =>
              setCustomKitchen((current) => (current.includes(item) ? current : [...current, item]))
            }
            onRemoveCustom={(item) =>
              setCustomKitchen((current) => current.filter((c) => c !== item))
            }
          />
          {error ? <p className="text-sm text-charme-clay">{error}</p> : null}
          <div className="flex justify-end">
            <Button onClick={runReasoning}>Connect the dots</Button>
          </div>
        </section>
      ) : null}

      {step === "insight" && plan ? (
        <CharmeInsight
          plan={plan}
          intent={intents.length ? primaryIntent(intents) : null}
          onContinue={() => setStep("ritual")}
        />
      ) : null}

      {step === "ritual" && plan ? (
        <RitualPlan
          plan={plan}
          onRecheck={() => {
            setIsRecheck(true);
            setStep("upload");
          }}
        />
      ) : null}

      {step === "journey" && previousAnalysis && analysis ? (
        <SkinJourney
          previous={previousAnalysis}
          current={analysis}
          observation={journeyObservation}
          onContinue={() => setStep("wisdom")}
        />
      ) : null}

      <SafetyFooter />
    </div>
  );
}
