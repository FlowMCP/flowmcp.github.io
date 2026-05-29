# Changelog

All notable changes to the FlowMCP documentation website are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> The website is a consumer of `flowmcp-spec` and `dot-github`. Many content changes are auto-synced via the `refs.resolved.json` pipeline. This changelog captures site-level changes (build, routing, layout, content scaffolding) — schema/spec changes live in those upstream repos.

## [Unreleased]

### Added
- External links open in a new tab via rehype plugin (#92).
- Conceptual page `concepts/pipeline-architecture.md` translated to English.

### Changed
- `package.json` completed per Memo 079 Kap. 6 Soll-Liste (description, license, repository, bugs, homepage, engines).

## [0.0.1]

### Added
- Initial Astro/Starlight scaffold.
- `concepts/`, `specification/`, `de/`, `quickstart/` content trees.
- Build chain: `fetch-refs.mjs` → `replace-placeholders.mjs` → `sync-schemas.mjs` → `check-spec-links.mjs` → `generate-llms-txt.mjs`.

### Notes
- Retrospective entry — pre-CHANGELOG history captured via git log only.
