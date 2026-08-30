// Every screen body the shell can render, picked by slug. Two are REAL features
// (notes → convex/notes.ts, assistant → app/api/chat/route.ts); the other two are
// static placeholders — the seam where you drop your own <Authenticated> data.
import { Authenticated } from "convex/react";
import { FAB, NOTES, type MenuItem } from "./menu";
import { NotesScreen } from "./notes-screen";
import { AssistantScreen } from "./assistant-screen";
import { UpdateCard } from "./update-card";

// Slugs come from menu.ts so the router and the nav can never disagree.
export function Screen({ app }: { app: MenuItem }) {
  if (app.slug === NOTES.slug) return <NotesScreen />;
  if (app.slug === FAB.slug) return <AssistantScreen />;
  return app.group === "system" ? <SettingsScreen app={app} /> : <DashboardScreen app={app} />;
}

// Project features → a dashboard: stat tiles + a recent list.
export function DashboardScreen({ app }: { app: MenuItem }) {
  const tiles = ["Total", "Active", "Pending", "Archived"];
  const rows = ["Placeholder row one", "Placeholder row two", "Placeholder row three"];
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t} className="card min-w-0 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Placeholder metric</p>
          </div>
        ))}
      </section>

      <section className="card w-full p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-sm font-semibold">{app.label} — recent</h2>
          <span className="text-xs text-muted-foreground">Placeholder</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r} className="flex items-center gap-3 py-3">
              <span className="h-8 w-8 shrink-0 rounded-lg bg-card-hover" />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{r}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Sample content — replace with a real query
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// System features → a settings form: labelled rows + inert controls. Visibly
// different from the dashboard grid, so "Settings" doesn't look like "Dashboard".
export function SettingsScreen({ app }: { app: MenuItem }) {
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* The one non-placeholder thing on this screen: a clone needs a way to
          learn the template moved on. Signed-in only — it calls Convex. */}
      {app.slug === "settings" && (
        <Authenticated>
          <UpdateCard />
        </Authenticated>
      )}

      <section className="card divide-y divide-border">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold">{app.label}</h2>
          <p className="text-xs text-muted-foreground">
            Placeholder settings — wire these to real values.
          </p>
        </div>
        <SettingRow label="Workspace name" hint="Shown across the app">
          <input aria-label="Workspace name" className="field w-full sm:max-w-64" placeholder="Acme Inc." disabled />
        </SettingRow>
        <SettingRow label="Time zone" hint="Used for every timestamp">
          <span className="field block w-full text-muted-foreground sm:max-w-64">UTC · placeholder</span>
        </SettingRow>
      </section>

      <section className="card divide-y divide-border">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold">Preferences</h2>
        </div>
        <SettingRow label="Email notifications" hint="A digest of activity">
          <Toggle on />
        </SettingRow>
        <SettingRow label="Compact mode" hint="Denser layout">
          <Toggle />
        </SettingRow>
      </section>
    </div>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="w-full sm:w-auto sm:shrink-0">{children}</div>
    </div>
  );
}

// Inert switch — a placeholder that shows the shape, so it's decorative (aria-hidden).
function Toggle({ on = false }: { on?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
        on ? "justify-end bg-accent" : "justify-start bg-card-hover"
      }`}
    >
      <span className="h-5 w-5 rounded-full bg-background shadow-sm" />
    </span>
  );
}
