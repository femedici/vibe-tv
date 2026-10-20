<!--
Sync Impact Report
Version: 1.0.0 -> 1.1.0 (owner accepted documented factory reset as fallback and authorized standalone app installation)
Principles: populated from user requirements, global rules and confirmed Tizen scope.
Added: Platform and preservation boundaries; Development and verification.
Removed: template examples. No new domain or performance principles assumed.
-->
# Vibe TV Constitution

## Core Principles

### I. Preserve the existing television
The Samsung system, Smart Hub, installed applications, accounts, picture, sound,
network, inputs, pairing, and factory settings MUST remain available. Development
MUST NOT reset, clear data, uninstall, disable system components, or replace firmware.
The owner accepted documented factory reset as a fallback instead of a full backup,
understanding that settings and logins may need to be recreated and firmware downgrade
is not supported. Installation of the separate Vibe TV application is now authorized.
No integral backup or guaranteed recovery from firmware corruption may be claimed.
An inventory, source clone or application preferences export is not a full backup.

### II. Respect the confirmed platform and authorization
The identified target is Samsung UN50AU8000GXZD running Tizen. The upstream Android
application cannot run directly on this platform. The user approved investigating
an independent Tizen application while preserving Smart Hub and existing applications.
Local development and device installation are separate steps: platform limitations and
recovery requirements MUST be resolved before installation. Material scope changes
require a user decision.

### III. Represent capabilities and history truthfully
The interface MUST NOT invent watched content, episode progress, service sessions,
installed applications, successful launches, or hardware validation. Features requiring
provider or platform support MUST remain explicitly unverified or unavailable until
supported by evidence. Local demonstrations MUST be identified as demonstrations;
they do not establish TV compatibility.

### IV. Retain the requested user experience
The hub MUST prioritize the last accessed application, relevant artwork and available
actions, editable app order, supplied PS5 artwork for HDMI 2, and light, dark, gray,
pastel and wine themes. Initial order is YouTube, PS5, Netflix, Prime Video, HBO Max,
Samsung TV Plus, Disney+ and Spotify. Navigation MUST support the remote. Existing
TV configuration access MUST remain available. Unsupported original requirements
remain documented, never silently removed or declared implemented.

### V. Verify proportionally and preserve provenance
Retain upstream history and license. Prefer existing code, platform facilities and the
smallest correct implementation. Nontrivial behavior uses a minimal failing test before
implementation, then passing verification. The coordinator inspects agent diffs and
fresh checks before marking work done. Source, screenshots, documentation and handoff
MUST distinguish completed, planned, blocked and unverified work. Secrets and sensitive
device identifiers MUST remain outside Git and public screenshots.

## Platform and preservation boundaries

Spec Kit is fixed at 1.0.3; no automatic upgrade. The active feature tasks.md is the
single tracker. Research and local work can proceed within approved scope. Rooting,
firmware replacement, factory reset, Smart Hub reset, private service token migration,
and disabling Samsung components are not authorized shortcuts.

## Development and verification

Use an agent/ branch; never commit or push task changes directly to main. Parallel
writers use isolated worktrees with disjoint ownership and a common base. Only the
coordinator updates tasks and integrates. Relevant tests, interface checks and captures
precede delivery; physical TV boot, app launch, HDMI and recovery remain distinct checks.
Task commits and push are authorized. Merge, deploy and worktree cleanup are not
implicitly authorized.

## Governance

This constitution records explicit user requirements and confirmed decisions. Changes
must preserve them unless the user authorizes an amendment; record reasons and update
the living spec and tracker. Version amendments semantically and check compliance during
specification, planning, review and convergence. Higher-priority instructions prevail.

**Version**: 1.1.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
