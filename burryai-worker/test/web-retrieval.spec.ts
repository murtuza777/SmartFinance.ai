import { describe, expect, it } from "vitest"
import { searchWebForIncomeIdeas } from "../src/web/search.provider"
import { summarizeWebResults } from "../src/web/summarize"

describe("web retrieval", () => {
  it("skips search when intent/query is not income related", async () => {
    const results = await searchWebForIncomeIdeas({
      intent: "budgeting",
      message: "How do I reduce food expenses?",
      env: {}
    })

    expect(results).toEqual([])
  })

  it("returns empty results without configured providers", async () => {
    const results = await searchWebForIncomeIdeas({
      intent: "income",
      message: "best remote student gigs",
      env: {}
    })

    expect(results).toEqual([])
  })

  it("summarizes fetched web results with citations", () => {
    const summary = summarizeWebResults([
      {
        title: "Student Remote Tutor Jobs",
        url: "https://example.com/jobs",
        snippet: "Part-time remote tutoring opportunities.",
        source: "tavily"
      }
    ])

    expect(summary).toContain("https://example.com/jobs")
    expect(summary).toContain("Student Remote Tutor Jobs")
  })
})
