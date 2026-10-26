---
name: pnpm audit fixes
description: Workspace-specific audit behavior and compatibility precautions.
---

Running `pnpm audit --fix` from nested directories, even unused skill-template directories, can rewrite the shared workspace configuration rather than the local manifest. Its output may still say it edited package.json.

**Why:** Observed with this workspace's pnpm version; automatic fixes also proposed an unrestricted Zod major upgrade, which exceeds a targeted dependency-remediation scope and risks breaking consumers.

**How to apply:** Run the per-manifest checks when requested, then inspect the shared overrides before installing. Prefer compatible patched versions, preserve the release-age safeguard, and avoid retaining unrelated major upgrades.
