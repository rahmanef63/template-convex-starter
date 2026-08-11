// `bun run update:template` — pull newer template code into a clone.
//
// A fork stops receiving upstream commits the moment it's created. This wires
// the template back up as a second remote and shows you exactly what's new; it
// deliberately does NOT merge for you, because merging into code you've since
// edited is a decision, not a chore. It prints the one command to run when
// you've read the list.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REMOTE = "template";
const REPO = "https://github.com/rahmanef63/template-convex-starter.git";
const BRANCH = "main";

// stderr is captured, not inherited: several calls below are *probes* that are
// expected to fail (no manifest on an older template), and git's "fatal:" line
// would otherwise land in the user's terminal looking like a real failure.
// Where a failure matters, this script prints its own message.
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const quiet = (...args) => {
  try {
    return git(...args);
  } catch {
    return "";
  }
};

if (!quiet("rev-parse", "--git-dir")) {
  console.error("[update] not a git repository — nothing to update.");
  process.exit(1);
}

// Refuse to touch a dirty tree: a merge on top of uncommitted work is how people
// lose it.
if (quiet("status", "--porcelain")) {
  console.error("[update] you have uncommitted changes. Commit or stash them first.");
  process.exit(1);
}

const remotes = quiet("remote").split("\n").filter(Boolean);
if (!remotes.includes(REMOTE)) {
  console.log(`[update] adding remote "${REMOTE}" → ${REPO}`);
  git("remote", "add", REMOTE, REPO);
}

console.log(`[update] fetching ${REMOTE}/${BRANCH}…`);
try {
  git("fetch", "--quiet", REMOTE, BRANCH);
} catch {
  console.error("[update] fetch failed — check your network or the remote URL.");
  process.exit(1);
}

const local = JSON.parse(readFileSync(new URL("../version.json", import.meta.url), "utf8"));
let upstream = null;
try {
  upstream = JSON.parse(git("show", `${REMOTE}/${BRANCH}:version.json`));
} catch {
  /* older templates had no manifest — fall back to the commit list */
}

const ahead = quiet("log", "--oneline", `HEAD..${REMOTE}/${BRANCH}`)
  .split("\n")
  .filter(Boolean);

console.log(`\n  you:      v${local.core ?? local.version}`);
if (upstream) console.log(`  template: v${upstream.core ?? upstream.version}`);

if (ahead.length === 0) {
  console.log("\n[update] already up to date — nothing upstream you don't have.\n");
  process.exit(0);
}

console.log(`\n[update] ${ahead.length} commit(s) you don't have:\n`);
for (const line of ahead.slice(0, 20)) console.log(`  ${line}`);
if (ahead.length > 20) console.log(`  … and ${ahead.length - 20} more`);

console.log(`
[update] Nothing has been merged. To take them:

    git merge ${REMOTE}/${BRANCH}

Expect conflicts in files you've edited (that's the point — your code wins where
you decided it should). Then:

    bun install && bun run check     # prove it still works
    git push                          # Vercel rebuilds, Convex deploys with it
`);
