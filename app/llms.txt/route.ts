import { NextResponse } from "next/server";

const LLMS_TXT = `# Opensport

> The open framework for sports data, odds, and agent execution.
> MIT-licensed. Python and TypeScript. Provider-agnostic.

Opensport is a four-layer framework for building autonomous sports trading and analysis agents.
Swap any component (provider, executor, agent) without touching the others.
All odds are normalised to decimal format. All layers communicate through shared core models.

## Documentation

- [Overview](https://opensport.dev/docs): Introduction to opensport, supported sports and markets
- [Quickstart](https://opensport.dev/docs/quickstart): Zero to first simulated position in Python or TypeScript, no API key required
- [Architecture](https://opensport.dev/docs/architecture): Four-layer design — Core models, Providers, Execution, Agents
- [Providers reference](https://opensport.dev/docs/providers): BaseProvider interface, MockProvider, building custom providers, supported sports and market types
- [Execution reference](https://opensport.dev/docs/execution): BaseExecutor, BetIntent, Position, Simulator (paper trading), ExchangeExecutor (live), risk guards
- [Agents reference](https://opensport.dev/docs/agents): BaseAgent, AgentConfig, ValueAgent strategy, building custom agents, LLM tool-use integration

## Optional

- [llms-full.txt](https://opensport.dev/llms-full.txt): Full plain-text documentation for ingestion
`;

export function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
