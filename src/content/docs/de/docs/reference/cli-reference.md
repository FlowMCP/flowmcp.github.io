---
title: CLI-Referenz
description: Vollstaendige FlowMCP CLI Befehlsreferenz
---

Die FlowMCP CLI ist ein Kommandozeilen-Tool fuer die Entwicklung, Validierung und Verwaltung von FlowMCP-Schemas. Sie behandelt Schema-Imports, Gruppen-Verwaltung, Live-API-Tests, Migration und kann als MCP-Server fuer KI-Agent-Integration laufen.

## Installation

```bash
npm install -g flowmcp-cli
```

Oder lokal klonen und verlinken:

```bash
git clone https://github.com/FlowMCP/flowmcp-cli.git
cd flowmcp-cli
npm install
npm link
```

## Architektur

Die CLI arbeitet auf zwei Konfigurationsebenen:

| Ebene | Pfad | Inhalt |
|-------|------|--------|
| **Global** | `~/.flowmcp/` | Config, `.env` mit API-Schluesseln, alle importierten Schemas |
| **Lokal** | `{project}/.flowmcp/` | Projekt-Config, Gruppen mit ausgewaehlten Tools |

```
~/.flowmcp/
├── config.json          # Globale Konfiguration
├── .env                 # API-Schluessel fuer Schema-Tests
└── schemas/             # Alle importierten Schema-Dateien
    └── flowmcp-schemas/ # Von GitHub importiert

{project}/.flowmcp/
├── config.json          # Konfiguration auf Projektebene
└── groups/              # Tool-Gruppen fuer dieses Projekt
```

## Zwei Modi

Die CLI hat zwei Betriebsmodi, die steuern, welche Befehle verfuegbar sind:

| Modus | Standard | Beschreibung |
|-------|----------|-------------|
| **Agent** | Ja | Teilmenge der Befehle fuer KI-Agent-Nutzung (search, add, remove, list, call, run) |
| **Dev** | Nein | Alle Befehle inkl. Validierung, Tests, Schema-Browsing, Migration und Imports |

Wechsle Modi mit `flowmcp mode agent` oder `flowmcp mode dev`.

:::note
Agent-Modus ist der Standard. Er stellt nur die Befehle bereit, die ein KI-Agent zum Entdecken, Aktivieren und Aufrufen von Tools braucht. Wechsle in den Dev-Modus fuer Schema-Entwicklung und Validierungs-Workflows.
:::

## Befehle

### Setup

#### `flowmcp init`

Interaktives Setup, das globale und lokale Konfiguration erstellt. Einmal pro Projekt ausfuehren.

```bash
flowmcp init
```

#### `flowmcp status`

Config, Quellen, Gruppen und Health-Info anzeigen.

```bash
flowmcp status
```

#### `flowmcp mode [agent|dev]`

Aktuellen Modus anzeigen oder wechseln.

```bash
flowmcp mode        # Aktuellen Modus anzeigen
flowmcp mode dev    # In Dev-Modus wechseln
flowmcp mode agent  # In Agent-Modus wechseln
```

### Discovery

#### `flowmcp search <query>`

Verfuegbare Tools per Stichwort finden.

```bash
flowmcp search etherscan
flowmcp search "gas price"
flowmcp search defi
```

#### `flowmcp schemas`

Alle verfuegbaren Schemas und ihre Tools auflisten. **Nur im Dev-Modus.**

```bash
flowmcp schemas
```

### Schema-Verwaltung

#### `flowmcp add <tool-name>`

Tool fuer dieses Projekt aktivieren.

```bash
flowmcp add coingecko_simplePrice
```

#### `flowmcp remove <tool-name>`

Tool aus dem Projekt deaktivieren.

```bash
flowmcp remove coingecko_simplePrice
```

#### `flowmcp list`

Alle aktiven Tools im aktuellen Projekt anzeigen.

```bash
flowmcp list
```

#### `flowmcp import <url> [--branch name]`

Schemas aus einem GitHub-Repository importieren. **Nur im Dev-Modus.**

```bash
flowmcp import https://github.com/FlowMCP/flowmcp-schemas
flowmcp import https://github.com/FlowMCP/flowmcp-schemas --branch develop
```

#### `flowmcp update [source-name]`

Schemas von Remote-Registries per Hash-basiertem Delta-Sync aktualisieren.

```bash
flowmcp update                    # Alle Quellen aktualisieren
flowmcp update flowmcp-schemas    # Bestimmte Quelle aktualisieren
```

### Migration

#### `flowmcp migrate <path> [flags]`

Schemas von v2 zu v3 migrieren. Benennt `routes` in `tools` um und aktualisiert das Versions-Feld. **Nur im Dev-Modus.**

```bash
flowmcp migrate ./schemas/coingecko/Ping.mjs
flowmcp migrate --all ./schemas/
flowmcp migrate --dry-run ./schemas/coingecko/Ping.mjs
```

:::tip
Immer zuerst `--dry-run` verwenden, um Aenderungen vorab zu pruefen. Der migrate-Befehl modifiziert Dateien direkt.
:::

### Gruppen-Verwaltung

Gruppen organisieren Tools in benannten Sammlungen. Jedes Projekt kann mehrere Gruppen haben, wobei eine als Standard gesetzt wird.

#### `flowmcp group list`

Alle Gruppen und ihre Tool-Anzahl auflisten.

```bash
flowmcp group list
```

#### `flowmcp group append <name> --tools "refs"`

Tools zu einer Gruppe hinzufuegen. Erstellt die Gruppe, wenn sie nicht existiert.

```bash
flowmcp group append crypto --tools "flowmcp-schemas/coingecko/simplePrice.mjs,flowmcp-schemas/etherscan/getBalance.mjs"
```

#### `flowmcp group set-default <name>`

Standard-Gruppe fuer `call`, `test` und `run` setzen.

```bash
flowmcp group set-default crypto
```

### Validierung und Tests (Dev-Modus)

#### `flowmcp validate [path] [--group name]`

Schema-Struktur gegen die FlowMCP-Spezifikation validieren.

```bash
flowmcp validate
flowmcp validate ./my-schema.mjs
flowmcp validate --group crypto
```

#### `flowmcp test project [--route name] [--group name]`

Standard-Gruppen-Schemas mit Live-API-Aufrufen testen.

```bash
flowmcp test project
flowmcp test project --route getBalance
```

#### `flowmcp test single <path> [--route name]`

Eine einzelne Schema-Datei testen.

```bash
flowmcp test single ./my-schema.mjs
flowmcp test single ./my-schema.mjs --route getBalance
```

### Ausfuehrung

#### `flowmcp call <tool-name> [json] [--group name]`

Ein Tool mit optionalem JSON-Input aufrufen.

```bash
flowmcp call coingecko_simplePrice '{"ids":"bitcoin","vs_currencies":"usd"}'
```

#### `flowmcp run [--group name]`

Als MCP-Server mit stdio-Transport starten. Wird fuer die Integration mit KI-Agent-Frameworks wie Claude Code verwendet.

```bash
flowmcp run
flowmcp run --group crypto
```

:::tip
`flowmcp run` verwenden, um die CLI direkt mit Claude Desktop oder anderen MCP-kompatiblen KI-Clients via stdio-Transport zu verbinden.
:::

## Tool-Referenz-Format

Tools werden im `source/file.mjs`-Format mit optionalen Typ-Diskriminatoren referenziert:

```
source/file.mjs                        # Alle Tools aus einem Schema
source/file.mjs::tool::toolName        # Einzelnes Tool (v3-Format)
source/file.mjs::resource::resName     # Einzelne Resource (v3-Format)
source/file.mjs::skill::skillName      # Einzelner Skill (v3-Format)
```

## Umgebungsvariablen

API-Schluessel fuer Schema-Tests in `~/.flowmcp/.env`:

```bash
ETHERSCAN_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here
DUNE_API_KEY=your_key_here
```

:::caution
API-Schluessel niemals in die Versionskontrolle committen. Die `.env`-Datei in `~/.flowmcp/` ist dein globaler Schluessel-Speicher und sollte nur auf deinem Rechner bleiben.
:::
