# CAPTURE-TEST.md

## Tool and model

- **Interface:** Claude.ai chat (web), using its Code Execution / file-creation
  tools (bash, file read/write, present_files) to work directly in a sandboxed
  project directory and hand back downloadable files.
- **Model:** Claude Sonnet 5, used for every turn of this build.
- **Not used:** Claude Code, Cursor, Codex CLI, Windsurf, Aider, or any other
  tool with a repo-local hook/lifecycle/rules mechanism.

## Mechanism check (step 1 of the setup doc)

Claude.ai's chat interface is a hosted product, not a CLI or IDE agent
installed against a local repo. It has no `.claude/settings.json`-style hook
system, no project rules file, and no session-transcript file on disk that a
script could tail or export from — there is nothing in this environment to
wire a hook into. This was not assumed; it's a direct consequence of how the
product works (a browser chat session with server-side tool execution, no
local process the user controls).

**Conclusion:** no automatic capture mechanism exists for this setup. Per the
setup doc's own instruction — *"If your tool genuinely has no automatic
mechanism, say so explicitly, name what you checked, and wrap the session
instead"* — this file documents that finding and the manual fallback used.

## What actually went wrong

This should have been figured out and disclosed *before* any code was
written, in the very first reply of the project. It wasn't — the first reply
noted that the setup page couldn't be fetched for its content, but didn't
follow through on checking whether the mechanism applied to this tool at all.
That's on the agent, not hidden here.

As a result, `.agent-logs/` was not populated turn-by-turn from the start of
the build, and nothing was committed incrementally during the early part of
the session.

## The fix

1. **Retroactive reconstruction:** `.agent-logs/2026-09-14_reconstructed-session.md`
   contains every prompt and final response actually exchanged in this
   conversation, from the first message through to the point this gap was
   caught — compiled from the real conversation transcript, not summarized or
   cleaned up. Wrong turns, bugs the user had to point out, and corrections
   are left in, per the setup doc's instruction that a messy honest log scores
   better than a tidy one.
2. **No fabricated timestamps.** The chat interface does not expose
   per-message send/receive timestamps to the model. Rather than invent
   plausible-looking ones, each entry is marked `timestamp: not available —
   see note above` and entries are given a sequential order number instead.
   This is a real limitation of the interface, disclosed rather than papered
   over.
3. **Going forward, capture is incremental.** From the turn after this one
   onward, each new prompt/response pair is appended to a new dated log file
   as it happens, and committed as part of the same work — not batched at the
   end. This is the closest approximation of "automatic" capture available in
   a tool with no hook system: manual, but disciplined and real-time from this
   point on.

## Canary test

A live canary test (steps 4.1–4.3 of the setup doc) was not performed, since
there was no automatic mechanism to test — the "capture" here is the agent
manually transcribing each turn as it's produced, so there's nothing for a
canary prompt to verify beyond what the reconstructed log already
demonstrates. If a stricter verification is wanted, the next prompt sent in
this conversation can be used as a live canary and will appear as the first
entry of the new incremental log file described above.
