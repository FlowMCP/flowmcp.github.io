---
title: AgentProbe
description: Multi-Protokoll-Validierung fuer MCP-Server, A2A-Agenten und x402-Endpunkte
---

[AgentProbe](https://github.com/FlowMCP/mcp-agent-validator) ist ein webbasierter Multi-Protokoll-Validator fuer AI-Agent-Endpunkte. Gib eine URL ein und erhalte eine sofortige Bewertung ueber acht Protokoll-Ebenen.

**Live-Demo:** [agentprobe.xyz](https://agentprobe.xyz)

## Was es macht

- **Eingabe:** Eine einzelne Agent-Endpunkt-URL
- **Bewertung:** Fuehrt die `mcp-agent-assessment`-Pipeline mit protokollspezifischen Validatoren aus
- **Ausgabe:** Einheitliche Bewertungen pro Protokoll-Ebene plus Roh-Assessment-Daten

Eine URL genuegt. AgentProbe erkennt, welche Protokolle der Endpunkt unterstuetzt und validiert jedes einzeln.

## Protokoll-Ebenen

AgentProbe bewertet acht Protokoll-Ebenen:

| Ebene | Was geprueft wird |
|-------|------------------|
| **HTTP** | Konnektivitaet, HTTPS, SSL-Validierung, CORS, HTTP/2-Erkennung |
| **MCP** | Server-Discovery, Tool/Resource/Prompt-Auflistung, Capability-Erkennung |
| **A2A / AP2** | Agent-Card-Validierung, AP2-Version und Rollenerkennung via `capabilities.extensions` und `X-A2A-Extensions`-Header |
| **x402** | Erkennung zahlungspflichtiger Endpunkte mit Scheme-, Netzwerk- und Token-Analyse |
| **OAuth** | Discovery der Authorization-Server-Metadaten |
| **MCP Apps** | UI-Resource-Erkennung fuer MCP-Anwendungen |
| **HTML** | Website-Erkennung, Content-Type, SSL-Status, HTTP/2 |
| **ERC-8004** | On-Chain-Agent-Registry-Lookup mit OASF-Klassifikation, Reputation und Metadaten-Extraktion |

:::note
Nicht jeder Endpunkt unterstuetzt alle Protokolle. AgentProbe behandelt nicht unterstuetzte Ebenen elegant und zeigt nur Ergebnisse fuer erkannte Protokolle an.
:::

## Architektur

```
URL Input  -->  Server  -->  mcp-agent-assessment
                                    |
                    +-------+-------+-------+-------+
                    |       |       |       |       |
                   HTTP    MCP   A2A/AP2   x402   OAuth
                    |       |       |       |       |
                    +-------+-------+-------+-------+
                                    |
                               Results UI
```

Der Server empfaengt eine URL, leitet sie an die einheitliche Assessment-Pipeline weiter und gibt strukturierte Ergebnisse fuer jede Protokoll-Ebene zurueck.

## API-Endpunkte

### `POST /api/validate`

Gibt ein strukturiertes Validierungsergebnis mit separaten Abschnitten fuer jedes Protokoll zurueck.

```bash
curl -X POST https://agentprobe.xyz/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://your-endpoint.example.com/mcp"}'
```

Die Antwort enthaelt `mcp`-, `a2a`-, `ui`- (MCP Apps) und `oauth`-Objekte, jeweils mit `status`, `categories`, `summary` und `messages`.

### `POST /api/assess`

Gibt das Roh-Assessment-Ergebnis von `mcp-agent-assessment` mit vollstaendigen Ebenen-Details zurueck.

```bash
curl -X POST https://agentprobe.xyz/api/assess \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://your-endpoint.example.com/mcp"}'
```

Optionale Parameter:

| Key | Typ | Beschreibung |
|-----|-----|-------------|
| `timeout` | number | Timeout in Millisekunden |
| `erc8004` | object | ERC-8004-Konfiguration mit `rpcNodes` |

### `POST /api/lookup`

Abfrage der ERC-8004 On-Chain-Registry fuer Agent-Registrierungsdaten, Endpunkte, OASF-Klassifikation und Reputation.

```bash
curl -X POST https://agentprobe.xyz/api/lookup \
  -H 'Content-Type: application/json' \
  -d '{"agentId": 2340, "chainId": 8453}'
```

| Key | Typ | Beschreibung | Pflicht |
|-----|-----|-------------|---------|
| `agentId` | number | Agent-Token-ID in der ERC-8004-Registry | Ja |
| `chainId` | number oder string | Chain-ID (z.B. `8453` fuer Base) oder CAIP-2 (z.B. `eip155:8453`) | Ja |
| `rpcNodes` | object | Benutzerdefinierte RPC-Nodes pro Chain-Alias | Nein |

## Eigenen MCP-Server validieren

1. **MCP-Server deployen**

   Stelle sicher, dass dein MCP-Server oeffentlich erreichbar ist (z.B. via ngrok oder Cloud-Deployment).

2. **AgentProbe oeffnen**

   Gehe zu [agentprobe.xyz](https://agentprobe.xyz) in deinem Browser.

3. **Endpunkt-URL eingeben**

   Fuege deine MCP-Server-URL ein (z.B. `https://your-server.example.com/mcp`) und klicke auf Validieren.

4. **Ergebnisse pruefen**

   AgentProbe zeigt Bewertungen fuer jede Protokoll-Ebene. Gruen bedeutet unterstuetzt und valide, Rot bedeutet Probleme erkannt, Grau bedeutet nicht zutreffend.

Oder nutze die API direkt:

```bash
curl -X POST https://agentprobe.xyz/api/validate \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://your-server.example.com/mcp"}'
```

## Authentifizierung

Authentifizierung ist optional. Wenn `API_TOKEN` nicht gesetzt ist, ist die API offen (Dev-Modus).

Wenn `API_TOKEN` gesetzt ist, werden zwei Authentifizierungsmethoden unterstuetzt:

| Methode | Funktionsweise |
|---------|---------------|
| **Session Cookie** | Browser besucht die UI und erhaelt automatisch ein Session-Cookie |
| **Bearer Token** | Externe Skripte senden `Authorization: Bearer <API_TOKEN>`-Header |

```bash
# Mit Bearer Token
curl -X POST https://agentprobe.xyz/api/validate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-token-here' \
  -d '{"url": "https://your-endpoint.example.com"}'
```

## Abhaengigkeiten

AgentProbe baut auf dem FlowMCP-Validator-Oekosystem auf:

| Paket | Zweck |
|-------|-------|
| [mcp-agent-assessment](https://github.com/FlowMCP/mcp-server-assessment) | Einheitliche Assessment-Pipeline |
| [a2a-agent-validator](https://github.com/FlowMCP/a2a-agent-validator) | A2A-Agent-Card- und AP2-Erkennung |
| [x402-mcp-validator](https://github.com/FlowMCP/x402-mcp-validator) | x402-Zahlungsprotokoll-Validierung |
| [mcp-apps-validator](https://github.com/FlowMCP/mcp-apps-validator) | MCP Apps UI-Resource-Erkennung |
| [erc8004-registry-parser](https://github.com/FlowMCP/erc8004-registry-parser) | ERC-8004 On-Chain-Registry-Parsing |

## Links

- **Live-Demo**: [agentprobe.xyz](https://agentprobe.xyz)
- **GitHub**: [FlowMCP/mcp-agent-validator](https://github.com/FlowMCP/mcp-agent-validator)
- **Video**: [Auf YouTube ansehen](https://www.youtube.com/watch?v=gnmsCEly3fA)
- **DoraHacks**: [dorahacks.io/buidl/39293](https://dorahacks.io/buidl/39293)
