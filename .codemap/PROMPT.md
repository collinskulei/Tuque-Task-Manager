# Codebase Map, generation prompt

Use this to (re)generate `.codemap/scan.html` whenever the architecture
changes enough that the diagram goes stale (new services, new
integrations, an AI/agent layer added, etc.).

**To use it**: copy everything inside the fenced block below, the whole
block, as one unit, and paste it as your message into a fresh Claude
Code session opened in the repo you want mapped. It's self-contained: no
placeholders to fill in, no context from this conversation required.

`````text
Analyze THIS repository and generate a local "codebase map", a visual
diagram of how the codebase works and how it uses AI. Produce a single
self-contained .html file; no external service, no upload, no network
calls required to view it (an optional Google Fonts link may be used,
with a system-font fallback if offline).

## Steps

1. Investigate the repo and build the data model below (in memory, or
   written to .codemap/scan.json for reuse).
2. Generate .codemap/scan.html, ONE standalone HTML file (doctype, head
   with inline <style>, body with inline SVG diagram + <script>) that
   embeds the data directly as JS literals and renders it: no build step,
   no bundler, opens by double-clicking the file.
3. Write the finished HTML to .codemap/scan.html. Keep .codemap/
   git-ignored (it's a generated report, not source) except for the
   PROMPT.md this spec lives in, if one exists, negate that file
   explicitly in .gitignore so the spec stays tracked even though its
   output doesn't.
4. Tell the user the file path and that they can open it directly in a
   browser. Nothing leaves their machine, skip any consent/upload step.

## How to investigate

- Find where AI runs: generateText / streamText / generateObject /
  streamObject, @ai-sdk/* providers, agent loops, tool definitions
  (tool({...})), or any LLM provider SDK (OpenAI, Anthropic, Google, …).
- Identify the models and their provider.
- Identify tools models can call (Exa, Firecrawl, Parallel, DB queries,
  internal functions) and external integrations/services.
- Map the business logic too: the internal services/pipelines the
  product is built from (billing, ingestion, background workers, domain
  services, automation/rules engines), these become "service" nodes,
  and the interesting sentence goes on the edge (e.g. "charges Stripe on
  trial end").
- Map the main flows: entry points (routes, webhooks, pages, CLIs),
  scheduled jobs (crons/queues/workers), the agents, the models/tools
  they use, and the datastores/services they read and write.
- If there's no AI in the repo, say so plainly in the header and map the
  real request flow and business logic instead, a scan of zero is still
  a useful map.
- A BaaS/PaaS provider (Supabase, Firebase, etc.) is usually more than
  one node. If the app uses its auth, its database, its file storage,
  and its realtime/pubsub as genuinely separate concerns, model each as
  its own node (e.g. "Supabase Auth", "Supabase Postgres", "Supabase
  Storage", "Supabase Realtime") rather than one giant "Supabase" blob,
  since that's what actually shows up as distinct edges in the call graph.
- Don't let a rules/automation engine masquerade as an agent. If a
  "when X happens, do Y" engine is deterministic condition-matching (no
  LLM call in the loop), give it kind: "service", not kind: "agent", and
  say so explicitly in its detail, this is exactly the kind of thing a
  skim-reader could mistake for AI, so the map should pre-empt that
  reading.

## Data model

{
  "project": { "name", "tagline", "date" },
  "stats": { "agents", "models", "tools", "integrations" },
  "topIntegrations": [ { "label", "domain" } ],
  "graph": {
    "nodes": [ { "id", "label", "kind", "sub", "domain", "sourceRef",
                 "detail", "group", "x", "y" } ],
    "edges": [ { "from", "to", "kind", "label" } ]
  }
}

- kind: entry | cron | agent | model | tool | service | store | external
- group (optional): feature-name tag; grouped nodes render as one
  labeled dashed stack, stacked in the same column.
- x/y: hand-assign a simple column layout, entries in column A,
  services in column B, stores/external in column C.
- Caps: topIntegrations ≤10, nodes ≤60, edges ≤120, label ≤28 chars,
  sub ≤40, edge label ≤24, detail ≤200.

Layout conventions that read well:
- Node box ~218×60. Columns at roughly x = 40 / 380 / 740 (entry /
  service / store+external). Rows ~76-90px apart within a column, tight
  enough to read as one diagram, loose enough for edge labels to sit
  clear of neighboring nodes.
- Put anything genuinely used app-wide (a realtime listener mounted in a
  shared layout, a global error boundary) in the service column even
  though it's only "entered from" one representative page in the edge
  list, say so in its detail rather than drawing edges to every page
  that indirectly benefits.
- Group only the nodes that are literally the same feature area (e.g.
  every page under one dashboard shell), grouping unrelated nodes just
  to tidy the layout defeats the point of the backer rect.

## Renderer requirements for scan.html

- Pure HTML/CSS/vanilla JS, inline SVG for the diagram (no charting or
  diagram library, no CDN dependency required to function).
- Header: title, one-line tagline, stat chips (agents/models/tools/
  integrations), integration pills. If AI count is zero across the
  board, show an explicit "No AI/LLM found" banner, don't just leave
  the stat chips at zero and let the reader infer it.
- Diagram: nodes as rounded rects with a kind-colored left stripe and a
  kind badge; dashed backer rects for groups; bezier edges with arrow
  markers; edge labels shown as small pills at the midpoint. Edges
  crossing right-to-left (e.g. a store pushing back to a service) need
  their bezier control points flipped, not just their arrow direction:
  handle both column-orders in one anchor-point function rather than
  special-casing each edge.
- Click a node → highlight its edges and connected nodes, dim the rest,
  and show a side panel with: kind, sub, domain, one-line detail,
  sourceRef, and "calls/writes to" + "called by" lists (computed from
  the edge list, not hand-maintained). Click again (or click empty
  space) clears it. Drag is a separate interaction from click, treat a
  mousedown that never exceeds a small movement threshold as a click,
  and anything past that threshold as a drag, so the two don't fight.
- Keyboard accessible (tabindex + Enter/Space on nodes, visible focus
  ring) and theme-aware (light/dark via prefers-color-scheme, plus a
  manual toggle button cycling system → light → dark, backed by a
  data-theme attribute so CSS can key off either mechanism).
- Legend for the kind-color encoding, show all 8 kind colors even if
  this particular repo only uses three or four of them; it's explaining
  the encoding, not just this instance's usage.

## Modern UI/UX requirements

Treat this as a small, polished tool, not a debug dump, same
dependency-free constraint as above (vanilla CSS/JS, no UI framework, no
icon-font CDN; draw icons as tiny inline SVG or plain Unicode glyphs).

- **Collapsible side panel**: the node-inspector panel gets a collapse
  toggle distinct from its close button, collapsing shrinks it to a
  slim icon rail (just the kind-color swatch) so the diagram reclaims
  the width; expanding restores full detail. Animate the width change.
- **Tabs inside the side panel**: split a selected node's content into
  "Overview" (kind/sub/domain/detail/source) and "Connections"
  (calls/writes-to + called-by) tabs instead of one long stacked scroll.
  Reset to the Overview tab on every new selection.
- **Collapsible legend/filter sidebar**: convert the kind legend into a
  small collapsible rail (chevron toggle), and let each kind act as a
  filter tab/chip, clicking "Service" dims every node that isn't a
  service, the same visual language as node-click dimming. An "All"
  chip clears the filter. Collapsed state still shows a compact pill to
  reopen it.
- **Search**: a small text input that filters/dims nodes by label as you
  type, reusing the same dim/highlight mechanism as click-selection and
  kind-filtering, don't build a second visual language for it.
- **Responsive breakpoints**:
  - ≥1024px: diagram, filter rail, and inspector panel sit side by side.
  - 640–1024px: the inspector becomes an overlay drawer sliding in from
    the right over the diagram rather than squeezing it; the filter
    rail auto-collapses to its compact pill.
  - <640px: header stats wrap onto multiple lines, all tap targets are
    ≥40px, the inspector is a full-height slide-over, and the diagram
    pans via native touch/drag scroll inside its container.
- **Motion & polish**: 150–200ms ease transitions on hover, selection,
  panel collapse/expand, and tab switches. A consistent 4/8/12/16/24px
  spacing scale. Subtle elevation (shadow) on the floating panels so
  they read as layered above the canvas, not painted onto it. Visible
  hover states on nodes and edges, not just click/focus states.
- **Fit-to-view control**: a small button that resets/fits the diagram's
  scroll position back to the top-left origin, useful after dragging
  nodes around or filtering down to a subset.

## Output

Write the finished HTML to .codemap/scan.html and tell the user the file
path to open. Nothing else leaves their machine.

## Verification before calling it done

Don't just eyeball a screenshot. Confirm, via a real browser automation
pass against the file:// path:
- Zero console errors, zero failed requests, on first load.
- Clicking a node shows the side panel with correct kind/detail/
  calls-writes-to/called-by, and dims unconnected nodes/edges; clicking
  empty space clears it.
- Tab-focusing a node and pressing Enter selects it the same way a click
  would; the same is true of the panel's own Overview/Connections tabs
  and the kind-filter chips.
- The theme toggle actually cycles the data-theme attribute
  (null → "light" → "dark" → null) and the diagram's colors follow.
- The side panel and legend/filter rail actually collapse and expand
  (check the DOM/class state before and after, not just a screenshot).
- Dragging a node updates its position (check the SVG transform
  attribute before/after) and the edges attached to it follow, test
  this in isolation (fresh page load) since stale bounding-box reads
  from an earlier interaction in the same test can produce a false
  negative that looks like a drag bug when it's actually a test-timing
  artifact.
- Resize (or emulate) the viewport across the three breakpoints and
  confirm the inspector panel actually switches from inline to overlay
  behavior, not just visually shrinking.
`````
