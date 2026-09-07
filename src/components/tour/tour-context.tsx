"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** data-tour value to spotlight; omit for a centered, non-spotlit card. */
  target?: string;
  /** Route to navigate to before locating the target. Omit to stay put. */
  route?: string;
}

interface TourOptions {
  firstProjectId: string | null;
  isAdmin: boolean;
  isGuest: boolean;
}

function buildSteps({ firstProjectId, isAdmin, isGuest }: TourOptions): TourStep[] {
  const steps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Tuque Task Manager",
      body: "Let's walk through everything the app can do, step by step. Use Next / Back anytime, or Skip to leave whenever you like.",
    },
    {
      id: "my-tasks",
      route: "/dashboard",
      target: "my-tasks-link",
      title: "My Tasks",
      body: "Every task assigned to you, across every project, lives here. It's the first place to check each morning.",
    },
    {
      id: "inbox",
      route: "/dashboard/inbox",
      target: "inbox-link",
      title: "Inbox",
      body: "You'll be notified here whenever someone assigns you a task, comments on your work, or an automation rule fires.",
    },
  ];

  if (!isGuest) {
    steps.push({
      id: "workload",
      route: "/dashboard/workload",
      target: "workload-link",
      title: "Workload",
      body: "See how many open tasks each teammate has, so you can spot who's overloaded before it becomes a problem.",
    });
  }

  steps.push(
    {
      id: "projects",
      route: "/dashboard",
      target: "projects-section",
      title: "Projects",
      body: "Projects group related work together. Click any project in this list to open its board.",
    },
    {
      id: "new-project",
      route: "/dashboard",
      target: "new-project-btn",
      title: "Start a new project",
      body: "Click here anytime to spin up a new project, just give it a name and press Enter.",
    }
  );

  if (firstProjectId) {
    const projectRoute = `/dashboard/projects/${firstProjectId}`;
    steps.push(
      {
        id: "views",
        route: projectRoute,
        target: "view-switcher",
        title: "Five ways to see your work",
        body: "Switch between List, Board (kanban), Calendar, Timeline, and Reports: same tasks, different lens on them.",
      },
      {
        id: "add-task",
        route: projectRoute,
        target: "add-task-input",
        title: "Add a task in seconds",
        body: "Type a title and press Enter, or click Add. No forms, no friction.",
      },
      {
        id: "task-detail",
        route: projectRoute,
        target: "task-row",
        title: "Click any task to open it",
        body: "Inside, you can add subtasks, comments, file attachments, tags, custom fields, dependencies, and log time, all in one place.",
      },
      {
        id: "project-tools",
        route: projectRoute,
        target: "fields-btn",
        title: "Customize how you track work",
        body: '"Fields" adds custom columns like Priority or Budget. "Rules" automates busywork, for example "when status changes to Done, notify the assignee." "Form" gives you a shareable intake form that creates tasks automatically.',
      }
    );
  }

  steps.push({
    id: "portfolios",
    route: "/dashboard",
    target: "portfolios-section",
    title: "Portfolios",
    body: "Group several projects into a portfolio to see rollup progress across all of them at a glance.",
  });

  if (isAdmin) {
    steps.push({
      id: "admin",
      route: "/dashboard/admin",
      target: "admin-link",
      title: "Admin panel",
      body: "As an admin, you can change anyone's role and review a full audit log of sensitive actions.",
    });
  }

  steps.push(
    {
      id: "theme",
      route: "/dashboard",
      target: "theme-toggle",
      title: "Light or dark, your call",
      body: "Click here to switch themes. It remembers your choice next time you visit.",
    },
    {
      id: "done",
      title: "You're ready",
      body: 'That\'s the full tour. Click "Guide me" in the sidebar any time you want to see it again.',
    }
  );

  return steps;
}

interface TourContextValue {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  rect: DOMRect | null;
  locating: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a TourProvider");
  return ctx;
}

const LOCATE_TIMEOUT_MS = 4000;
const LOCATE_POLL_MS = 100;

export function TourProvider({
  firstProjectId,
  isAdmin,
  isGuest,
  children,
}: TourOptions & { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [locating, setLocating] = useState(false);
  const runIdRef = useRef(0);

  const steps = useMemo(
    () => buildSteps({ firstProjectId, isAdmin, isGuest }),
    [firstProjectId, isAdmin, isGuest]
  );

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setRect(null);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        setActive(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Locate (and navigate to) the current step's target whenever the step changes.
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step) return;

    const runId = ++runIdRef.current;
    // Kicking off a fresh imperative DOM-locate process for the new step,
    // not deriving state from props, so this can't move out of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRect(null);

    if (!step.target) {
      // Centered, non-spotlit card (welcome / done).
      if (step.route && step.route !== pathname) router.push(step.route);
      return;
    }

    if (step.route && step.route !== pathname) {
      router.push(step.route);
    }

    setLocating(true);
    const startedAt = Date.now();

    const poll = () => {
      if (runIdRef.current !== runId) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        window.setTimeout(() => {
          if (runIdRef.current !== runId) return;
          setRect(el.getBoundingClientRect());
          setLocating(false);
        }, 260);
        return;
      }
      if (Date.now() - startedAt > LOCATE_TIMEOUT_MS) {
        // Target never appeared (e.g. no tasks yet), so skip forward gracefully.
        setLocating(false);
        setStepIndex((i) => (i < steps.length - 1 ? i + 1 : i));
        return;
      }
      window.setTimeout(poll, LOCATE_POLL_MS);
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, pathname]);

  // Keep the spotlight aligned on resize/scroll while a step is showing.
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step?.target) return;

    function reposition() {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [active, stepIndex, steps]);

  // Escape closes the tour.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") stop();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stop]);

  const value: TourContextValue = { active, stepIndex, steps, rect, locating, start, next, prev, stop };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
