---
title: Use Cases
description: Concrete examples of how multiple data sources become useful answers through a single prompt.
---

## How It Works

The user enters a sentence in natural language. The agent automatically creates a workflow — with cron jobs, calendar integration, and multiple data sources. No programming, no configuration.

---

## Use Case 1: Dentist Appointment

### The Prompt

> Whenever there is a dentist appointment in my calendar: send me a message the day before at 6 PM with the expected weather and which transport option works best. On the morning of the appointment, by 7:30 AM at the latest, give me the exact route.

### What the Agent Does

The agent automatically creates a cron job that checks the calendar daily. When it finds a dentist appointment, it schedules two briefings.

**Evening before (6:00 PM):**

1. **Calendar** → Dentist appointment tomorrow 10:00 AM, Musterstrasse 5
2. **Weather** → 8°C, light rain from 11 AM
3. **Recommendation via chat:** "Tomorrow light rain from 11 AM. Biking to the appointment is fine (dry), return trip better by public transit."

**Morning of the appointment (7:30 AM):**

1. **Weather update** → Rain postponed to noon
2. **Public transit** → S-Bahn running on schedule, no disruptions
3. **Bike sharing** → nextbike at starting location: 3 bikes available
4. **Route** → Bike: 18 min (depart 9:40), Public transit: 25 min (depart 9:30)
5. **Recommendation via chat:** "Bike recommended (18 min, dry). nextbike Alexanderplatz, 3 bikes free. Return: S-Bahn recommended — rain expected from noon."

### Which Data Sources Are Combined?

| Data Source | What It Provides |
|-------------|-----------------|
| **Calendar** (Google/iCal via OpenClaw) | Appointment, time, address |
| **Bright Sky** (German Weather Service) | Weather, forecast, rain probability |
| **Deutsche Bahn** (transport.rest) | S-Bahn/U-Bahn connections, disruptions |
| **VBB** (transport.rest) | Regional public transit Berlin-Brandenburg |
| **nextbike** | Bike availability nearby |
| **Nominatim** (OpenStreetMap) | Convert address to coordinates |

**6 data sources for one answer.** None of them alone could fully answer the question. Only the combination makes the difference — the agent knows that biking there and taking the train back is the best option because it will rain in the afternoon.

---

## Use Case 2: Business Trip

### The Prompt

> When there is an appointment with the keyword "business trip" in my calendar: two days before, summarize the train connections to the destination, check the weather there, and show me the nearest stop to the meeting point. On the travel day at 7 AM, give me the current connection with real-time data.

### What the Agent Does

**2 days before the trip:**

1. **Calendar** → "Business trip Berlin → Munich", Meeting Leopoldstrasse 10
2. **Train connections** → ICE 8:05 Berlin Hbf (arrival 12:17), ICE 10:05 (arrival 14:13)
3. **Weather Munich** → 15°C, sunny, no rain
4. **Geocoding** → Leopoldstrasse 10 → coordinates → nearest stop: U-Bahn Giselastrasse (300m)
5. **Summary via chat:** "ICE 8:05 recommended (4h12). Munich sunny, 15°C. From station U3 direction Moosach → Giselastrasse, 300m to meeting."

**Travel day (7:00 AM):**

1. **Real-time** → ICE 8:05 on schedule, platform 7
2. **Alternative** → If missed: ICE 10:05
3. **Recommendation via chat:** "ICE 8:05 from Berlin Hbf, platform 7, on schedule. Arrival Munich Hbf 12:17. U3 Giselastrasse 300m from meeting. Weather: 15°C, sunny."

### Which Data Sources Are Combined?

| Data Source | What It Provides |
|-------------|-----------------|
| **Calendar** (Google/iCal via OpenClaw) | Appointment, destination, meeting address |
| **Deutsche Bahn** (transport.rest) | Long-distance connections, real-time data, platform |
| **Bright Sky** (German Weather Service) | Weather at destination |
| **Nominatim** (OpenStreetMap) | Meeting address to coordinates, nearest stop |

**4 data sources.** The agent plans the entire trip — from train connection through weather to the last mile to the meeting. On the travel day, it updates with real-time data.

---

## What These Examples Show

Both use cases share something:

1. **A single prompt** is enough — the agent creates the complete workflow
2. **Multiple data sources** are combined automatically — the user does not need to know where the data comes from
3. **Cron jobs** make it automatic — the agent works in the background, the user gets the result at the right time
4. **Calendar integration** makes it personal — the agent knows when and where

**One data source = one answer. Many data sources = a useful answer.**

Our schemas make this combination possible — and any developer can build their own use cases with them.

## Beyond Mobility

These examples show mobility as one domain — but FlowMCP works wherever data needs to be aggregated and made accessible to AI agents. The same pattern applies to environmental data, public administration, health, finance, or any other domain with structured data sources. Every schema-based integration follows the same approach.

- **Environment:** Air quality + weather + pollen count → "Should I go jogging outside today?"
- **Government:** Tenders + business registry + federal gazette → "Are there new relevant tenders in my field?"
- **Health:** Counseling centers + geocoding + public transit → "Which free counseling is near me and how do I get there?"
- **Education:** School holidays + events + weather → "What can I do with the kids during the break?"

---

All schemas used: [Schema Catalog →](/basics/schema-catalog/)

Contribute schemas: [Community Hub →](/roadmap/community/)
