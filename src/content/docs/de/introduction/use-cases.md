---
title: Use Cases
description: Konkrete Beispiele, wie mehrere Datenquellen durch einen einzigen Prompt zu nuetzlichen Antworten werden.
---

## Wie es funktioniert

Der Nutzer gibt einen Satz in normaler Sprache ein. Der Agent erstellt daraus automatisch einen Ablauf — mit Cron Jobs, Kalender-Anbindung und mehreren Datenquellen. Kein Programmieren, keine Konfiguration.

---

## Use Case 1: Zahnarzttermin

### Der Prompt

> Immer wenn ein Zahnarzttermin im Kalender steht: Schreib mir einen Tag vorher um 18 Uhr das voraussichtliche Wetter und welches Verkehrsmittel sich eignet. Am Morgen des Termins, spaetestens um 7:30 Uhr, gib mir die genaue Route.

### Was der Agent daraus macht

Der Agent erstellt automatisch einen Cron Job, der den Kalender taeglich prueft. Wenn er einen Zahnarzttermin findet, plant er zwei Briefings.

**Abend vorher (18:00 Uhr):**

1. **Kalender** → Zahnarzttermin morgen 10:00 Uhr, Musterstrasse 5
2. **Wetter** → 8°C, leichter Regen ab 11 Uhr
3. **Empfehlung via Chat:** "Morgen leichter Regen ab 11 Uhr. Hinfahrt mit dem Fahrrad moeglich (trocken), Rueckfahrt besser mit OEPNV."

**Morgen des Termins (7:30 Uhr):**

1. **Wetter-Update** → Regen verschoben auf 12 Uhr
2. **OEPNV** → S-Bahn faehrt planmaessig, keine Stoerungen
3. **Fahrrad** → nextbike am Startort: 3 Raeder verfuegbar
4. **Route** → Fahrrad: 18 min (Abfahrt 9:40), OEPNV: 25 min (Abfahrt 9:30)
5. **Empfehlung via Chat:** "Fahrrad empfohlen (18 min, trocken). nextbike Alexanderplatz, 3 Raeder frei. Rueckfahrt: S-Bahn empfohlen — Regen moeglich ab 12 Uhr."

### Welche Datenquellen werden kombiniert?

| Datenquelle | Was sie liefert |
|-------------|-----------------|
| **Kalender** (Google/iCal via OpenClaw) | Termin, Uhrzeit, Adresse |
| **Bright Sky** (Deutscher Wetterdienst) | Wetter, Vorhersage, Regenwahrscheinlichkeit |
| **Deutsche Bahn** (transport.rest) | S-Bahn/U-Bahn Verbindungen, Stoerungen |
| **VBB** (transport.rest) | Regionaler OEPNV Berlin-Brandenburg |
| **nextbike** | Fahrrad-Verfuegbarkeit in der Naehe |
| **Nominatim** (OpenStreetMap) | Adresse in Koordinaten umwandeln |

**6 Datenquellen fuer eine Antwort.** Keine davon allein koennte die Frage vollstaendig beantworten. Erst die Kombination macht den Unterschied — der Agent weiss, dass Fahrrad hin und OEPNV zurueck die beste Option ist, weil es am Nachmittag regnet.

---

## Use Case 2: Geschaeftsreise

### Der Prompt

> Wenn ein Termin mit dem Stichwort "Dienstreise" im Kalender steht: Zwei Tage vorher fasse mir die Zugverbindungen zum Zielort zusammen, pruefe das Wetter dort und zeig mir die naechste Haltestelle vom Meetingpoint. Am Reisetag morgens um 7 Uhr gib mir die aktuelle Verbindung mit Echtzeit-Daten.

### Was der Agent daraus macht

**2 Tage vor der Reise:**

1. **Kalender** → "Dienstreise Berlin → Muenchen", Meeting Leopoldstrasse 10
2. **Zugverbindungen** → ICE 8:05 Berlin Hbf (Ankunft 12:17), ICE 10:05 (Ankunft 14:13)
3. **Wetter Muenchen** → 15°C, sonnig, kein Regen
4. **Geocoding** → Leopoldstrasse 10 → Koordinaten → naechste Haltestelle: U-Bahn Giselastrasse (300m)
5. **Zusammenfassung via Chat:** "ICE 8:05 empfohlen (4h12). Muenchen sonnig, 15°C. Vom Bahnhof U3 Richtung Moosach → Giselastrasse, 300m zum Meeting."

**Reisetag (7:00 Uhr):**

1. **Echtzeit** → ICE 8:05 planmaessig, Gleis 7
2. **Alternative** → Falls verpasst: ICE 10:05
3. **Empfehlung via Chat:** "ICE 8:05 ab Berlin Hbf, Gleis 7, planmaessig. Ankunft Muenchen Hbf 12:17. U3 Giselastrasse in 300m vom Meeting. Wetter: 15°C, sonnig."

### Welche Datenquellen werden kombiniert?

| Datenquelle | Was sie liefert |
|-------------|-----------------|
| **Kalender** (Google/iCal via OpenClaw) | Termin, Zielort, Meeting-Adresse |
| **Deutsche Bahn** (transport.rest) | Fernverkehr-Verbindungen, Echtzeit-Daten, Gleis |
| **Bright Sky** (Deutscher Wetterdienst) | Wetter am Zielort |
| **Nominatim** (OpenStreetMap) | Meeting-Adresse in Koordinaten, naechste Haltestelle |

**4 Datenquellen.** Der Agent plant die gesamte Reise — von der Zugverbindung ueber das Wetter bis zur letzten Meile zum Meeting. Am Reisetag aktualisiert er mit Echtzeit-Daten.

---

## Was diese Beispiele zeigen

Beide Use Cases haben etwas gemeinsam:

1. **Ein einziger Prompt** reicht — der Agent erstellt den kompletten Ablauf
2. **Mehrere Datenquellen** werden automatisch kombiniert — der Nutzer muss nicht wissen, woher die Daten kommen
3. **Cron Jobs** machen es automatisch — der Agent arbeitet im Hintergrund, der Nutzer bekommt das Ergebnis zur richtigen Zeit
4. **Kalender-Integration** macht es persoenlich — der Agent weiss, wann und wohin

**Ein Datensatz = eine Antwort. Viele Datensaetze = eine nuetzliche Antwort.**

Unsere Schemas machen diese Kombination moeglich — und jeder Entwickler kann mit ihnen eigene Use Cases bauen.

## Ueber Mobilitaet hinaus

Diese Beispiele zeigen Mobilitaet als eine Domaene — aber FlowMCP funktioniert ueberall, wo Daten aggregiert und fuer KI-Agenten zugaenglich gemacht werden muessen. Das gleiche Muster gilt fuer Umweltdaten, oeffentliche Verwaltung, Gesundheit, Finanzen oder jede andere Domaene mit strukturierten Datenquellen. Jede Schema-basierte Integration folgt dem gleichen Ansatz.

- **Umwelt:** Luftqualitaet + Wetter + Pollenflug → "Soll ich heute draussen joggen?"
- **Verwaltung:** Ausschreibungen + Handelsregister + Bundesanzeiger → "Gibt es neue relevante Ausschreibungen in meinem Fachgebiet?"
- **Gesundheit:** Beratungsstellen + Geocoding + OEPNV → "Welche kostenlose Beratung gibt es in meiner Naehe und wie komme ich hin?"
- **Bildung:** Schulferien + Veranstaltungen + Wetter → "Was kann ich mit den Kindern in den Ferien unternehmen?"

---

Alle verwendeten Schemas: [Schema-Katalog →](/de/basics/schema-catalog/)

Eigene Schemas beitragen: [Community Hub →](/de/roadmap/community/)
