const diagramDescriptions = {
    'diagram-1-data-normalization': `graph LR
    A[Weather API] --> S[FlowMCP Schema]
    B[Transit API] --> S
    C[Geodata API] --> S
    D[Government API] --> S
    S --> T[Unified MCP Tools]
    T --> AI[Any AI Agent]`,

    'diagram-2-usage-architectures': `graph TD
    subgraph Level 1: Tools Only
        U1[User AI] -->|direct call| T1[Tool]
    end
    subgraph Level 2: Sub-Agent
        U2[User AI] --> A2[Agent with own LLM]
        A2 -->|agentic loop| T2a[Tool A]
        A2 -->|agentic loop| T2b[Tool B]
    end
    subgraph Level 3: Orchestration
        U3[User AI] --> C3[Coordinator Agent]
        C3 --> SA1[Sub-Agent 1]
        C3 --> SA2[Sub-Agent 2]
        SA1 --> T3a[Tool A]
        SA1 --> T3b[Tool B]
        SA2 --> T3c[Tool C]
        SA2 --> T3d[Tool D]
    end`,

    'diagram-3-mcp-compatibility': `graph LR
    MCP[MCP Protocol]
    MCP --> C1[Claude Desktop]
    MCP --> C2[ChatGPT]
    MCP --> C3[Cursor]
    MCP --> C4[VS Code Copilot]
    MCP --> C5[OpenClaw]
    MCP --> C6[108+ more clients]
    style MCP fill:#f9f,stroke:#333`,

    'provider-schema-aufbau': `graph TD
    P[Provider Schema] --> Tools[Tools - Required]
    P --> Resources[Resources - Optional]
    P --> Prompts[Prompts - Optional]
    P --> Skills[Skills - Optional]
    Tools --> T1[method, path, parameters]
    Tools --> T2[modifiers, tests, output]
    Resources --> R1[Local data: SQLite, Markdown]
    Prompts --> P1[Model-neutral AI guidance]
    Skills --> S1[Multi-tool step-by-step workflows]`,

    'tool-auswahl': `graph LR
    Cat[Schema Catalog] --> S1[Schema A: Weather]
    Cat --> S2[Schema B: Transit]
    Cat --> S3[Schema C: Bikes]
    S1 --> T1[getWeather]
    S1 --> T2[getForecast]
    S2 --> T3[getConnections]
    S3 --> T4[findStations]
    T1 --> TS[Tool Set]
    T3 --> TS
    T4 --> TS`,

    'agent-manifest-aufbau': `graph TD
    Agent[Agent Manifest]
    Agent --> LLM[Own LLM e.g. Claude Haiku]
    Agent --> SP[System Prompt: domain expertise]
    Agent --> SK[Skills: multi-step workflows]
    Agent --> TS[Tool Set: selected tools]
    TS --> Loop[Agentic Loop]
    Loop --> Understand[1. Understand question]
    Loop --> Select[2. Select tool]
    Loop --> Call[3. Call tool]
    Loop --> Evaluate[4. Evaluate result]
    Loop --> Decide[5. Done or loop again]`,

    'energieeffizienz': `graph LR
    subgraph Without Schema
        Q1[Question] --> Read[Read API docs]
        Read --> Parse[Parse endpoints]
        Parse --> Try[Trial and error]
        Try --> R1[Result: ~15x tokens]
    end
    subgraph With Schema
        Q2[Question] --> Tool[Call prepared tool]
        Tool --> R2[Result: 1x tokens]
    end`,

    'mvp-3-community': `graph TD
    AI[AI Agent discovers data source] --> Draft[AI creates schema draft]
    Draft --> Submit[Submit as GitHub Issue]
    Submit --> Review[Community reviews]
    Review --> Accept[Schema accepted into Hub]
    Accept --> Use[Everyone can use schema]
    Use --> Discover[More data sources discovered]
    Discover --> AI`,

    'pipeline-sicherheitsstufen': `graph LR
    S1[Stage 1: Submission] --> S2[Stage 2: Automatic Validation]
    S2 --> S3[Stage 3: AI Review]
    S3 --> S4[Stage 4: Human Approval]
    S4 --> S5[Stage 5: Integration]
    S2 -->|fail| Reject[Rejected with feedback]
    S3 -->|fail| Reject
    S4 -->|fail| Reject`,

    'scoring-threshold': `graph TD
    Score[Schema Quality Score]
    Score --> C1[Legality: 0-5 stars]
    Score --> C2[Quality: 0-5 stars]
    Score --> C3[Test Coverage: 0-5 stars]
    Score --> C4[Usefulness: 0-5 stars]
    Score --> C5[Documentation: 0-5 stars]
    C1 --> Avg[Average >= 3.0 stars required]
    C2 --> Avg
    C3 --> Avg
    C4 --> Avg
    C5 --> Avg
    Avg --> Pass[Pass: schema accepted]
    Avg --> Fail[Fail: improve and resubmit]`,
}

export default diagramDescriptions
