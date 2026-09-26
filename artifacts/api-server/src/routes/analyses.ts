import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { desc, eq } from "drizzle-orm";
import multer from "multer";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db, analysesTable, type Analysis, type Finding } from "@workspace/db";
import {
  CreateAnalysisBody,
  CreateAnalysisResponse,
  GetAnalysisParams,
  GetAnalysisResponse,
  GetDashboardSummaryResponse,
  ListAnalysesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
});
const execFileAsync = promisify(execFile);

function serializeAnalysis(analysis: Analysis) {
  return {
    id: analysis.id,
    name: analysis.name,
    description: analysis.description,
    techStack: analysis.techStack,
    status: analysis.status,
    score: analysis.score,
    grade: analysis.grade,
    createdAt: analysis.createdAt.toISOString(),
    executiveSummary: analysis.executiveSummary,
    recommendation: analysis.recommendation,
    strengths: analysis.strengths,
    categoryScores: analysis.categoryScores,
    findings: analysis.findings,
  };
}

function listItem(analysis: Analysis) {
  const findings = analysis.findings ?? [];
  return {
    id: analysis.id,
    name: analysis.name,
    status: analysis.status,
    score: analysis.score,
    grade: analysis.grade,
    createdAt: analysis.createdAt.toISOString(),
    criticalCount: findings.filter((finding) => finding.severity === "critical").length,
    highCount: findings.filter((finding) => finding.severity === "high").length,
  };
}

type ReviewInput = {
  name: string;
  description: string;
  techStack: string[];
  currentState: string;
  goals: string[];
  codeContext: string;
};

async function readProjectArchive(buffer: Buffer): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "project-auditor-"));
  const archivePath = path.join(tempDir, "project.zip");

  try {
    await fs.writeFile(archivePath, buffer);
    const { stdout } = await execFileAsync("unzip", ["-Z1", archivePath], {
      maxBuffer: 2 * 1024 * 1024,
    });
    const entries = stdout
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry && !entry.endsWith("/"));
    const ignoredPath = /(^|\/)(node_modules|\.git|dist|build|coverage|\.next|vendor|target)(\/|$)/;
    const textFile = /\.(c|cc|cpp|cs|css|go|html?|java|js|jsx|json|md|mjs|php|py|rb|rs|sql|svg|toml|ts|tsx|tsx|vue|yaml|yml|sh)$/i;
    const importantNames = /(^|\/)(Dockerfile|Makefile|Procfile|README|LICENSE|package\.json|pnpm-lock\.yaml|yarn\.lock|requirements\.txt|\.env\.example)$/i;
    const inspectable = entries
      .filter((entry) => !ignoredPath.test(entry))
      .filter((entry) => textFile.test(entry) || importantNames.test(entry))
      .slice(0, 140);
    const sections = [`Archive contains ${entries.length} files. Showing up to ${inspectable.length} relevant text files.`];

    for (const entry of inspectable) {
      try {
        const { stdout: content } = await execFileAsync("unzip", ["-p", archivePath, entry], {
          maxBuffer: 80 * 1024,
        });
        const trimmed = content.slice(0, 20_000);
        if (trimmed.trim()) {
          sections.push(`\n--- ${entry} ---\n${trimmed}`);
        }
      } catch {
        // Binary or malformed files are skipped; the archive manifest is still useful evidence.
      }
      if (sections.join("\n").length > 220_000) break;
    }

    return sections.join("\n");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function generateAiReport(input: ReviewInput) {
  const prompt = `You are a top-tier principal engineer, security architect, reliability engineer, and product strategist conducting a rigorous codebase review.
Think through the evidence in multiple passes: understand the product intent, map the architecture, identify concrete correctness/security/reliability risks, assess operational readiness, then prioritize the smallest set of actions with the highest leverage.
Be demanding but fair. Separate observed evidence from inference. Do not invent files, frameworks, tests, or behavior that are not present. Treat the project description as intent and the archive contents as evidence.
Return only valid JSON with this exact shape:
{
  "score": 0,
  "grade": "A|B|C|D|F",
  "executiveSummary": "string",
  "recommendation": "string",
  "strengths": ["string"],
  "categoryScores": [{"category":"Architecture|Security|Reliability|Scalability|Product readiness|Developer experience","score":0,"note":"string"}],
  "findings": [{"severity":"critical|high|medium|low","category":"string","title":"string","summary":"string","evidence":"string","recommendation":"string","effort":"quick-win|focused|involved","status":"open","fileRef":"string or null"}]
}
Return 6-10 findings sorted by severity, use whole-number scores from 0 to 100, and cite relevant file paths in fileRef whenever the archive provides evidence.

Project name: ${input.name}
Description: ${input.description}
Tech stack: ${input.techStack.join(", ") || "Infer from archive"}
Current state: ${input.currentState}
Goals: ${input.goals.join("; ") || "Not provided"}

PROJECT ARCHIVE EVIDENCE:
${input.codeContext}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "openai/gpt-oss-20b",
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are the highest-standard engineering reviewer. Follow the JSON contract exactly.",
      },
      { role: "user", content: prompt },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("The AI provider returned an empty analysis.");

  const result = JSON.parse(content) as {
    score: number;
    grade: string;
    executiveSummary: string;
    recommendation: string;
    strengths: string[];
    categoryScores: Array<{ category: string; score: number; note: string }>;
    findings: Array<Omit<Finding, "id">>;
  };

  return {
    score: Math.max(0, Math.min(100, Math.round(result.score))),
    grade: result.grade,
    executiveSummary: result.executiveSummary,
    recommendation: result.recommendation,
    strengths: result.strengths,
    categoryScores: result.categoryScores,
    findings: result.findings.map((finding, index) => ({ ...finding, id: index + 1 })),
  };
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const analyses = await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt));
  const openFindings = analyses.reduce(
    (total, analysis) => total + analysis.findings.filter((finding) => finding.status === "open").length,
    0,
  );
  const criticalIssues = analyses.reduce(
    (total, analysis) =>
      total +
      analysis.findings.filter(
        (finding) => finding.status === "open" && finding.severity === "critical",
      ).length,
    0,
  );
  const averageScore = analyses.length
    ? Math.round(analyses.reduce((total, analysis) => total + analysis.score, 0) / analyses.length)
    : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalAnalyses: analyses.length,
      averageScore,
      openFindings,
      criticalIssues,
      recentAnalyses: analyses.slice(0, 5).map(listItem),
    }),
  );
});

router.get("/analyses", async (_req, res): Promise<void> => {
  const analyses = await db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt));
  res.json(ListAnalysesResponse.parse(analyses.map(listItem)));
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(GetAnalysisResponse.parse(serializeAnalysis(analysis)));
});

router.post("/analyses", async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "AI analysis is not configured on the server." });
    return;
  }

  const input = parsed.data;
  const prompt = `You are a principal engineer conducting a rigorous production-readiness review.
Analyze the following project snapshot. Be specific, evidence-driven, and pragmatic. Focus on architecture,
security, reliability, scalability, product completeness, and developer experience. Do not invent files that
were not provided. Return only valid JSON with this exact shape:
{
  "score": 0,
  "grade": "A|B|C|D|F",
  "executiveSummary": "string",
  "recommendation": "string",
  "strengths": ["string"],
  "categoryScores": [{"category":"Architecture|Security|Reliability|Scalability|Product readiness|Developer experience","score":0,"note":"string"}],
  "findings": [{"severity":"critical|high|medium|low","category":"string","title":"string","summary":"string","evidence":"string","recommendation":"string","effort":"quick-win|focused|involved","status":"open","fileRef":"string or null"}]
}
Return 4-8 findings, sorted by severity, and use whole-number scores from 0 to 100.

Project name: ${input.name}
Description: ${input.description}
Tech stack: ${input.techStack.join(", ")}
Current state: ${input.currentState}
Goals: ${(input.goals ?? []).join("; ") || "Not provided"}
Code context / architecture notes:
${input.codeContext || "Not provided"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "llama-3.3-70b-versatile",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a principal engineer. Follow the requested JSON contract exactly.",
        },
        { role: "user", content: prompt },
      ],
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: "The AI provider returned an empty analysis." });
      return;
    }

    const result = JSON.parse(content) as {
      score: number;
      grade: string;
      executiveSummary: string;
      recommendation: string;
      strengths: string[];
      categoryScores: Array<{ category: string; score: number; note: string }>;
      findings: Array<Omit<Finding, "id">>;
    };
    const findings = result.findings.map((finding, index) => ({ ...finding, id: index + 1 }));
    const [created] = await db
      .insert(analysesTable)
      .values({
        name: input.name,
        description: input.description,
        techStack: input.techStack,
        status: "completed",
        score: Math.max(0, Math.min(100, Math.round(result.score))),
        grade: result.grade,
        executiveSummary: result.executiveSummary,
        recommendation: result.recommendation,
        strengths: result.strengths,
        categoryScores: result.categoryScores,
        findings,
      })
      .returning();

    res.status(201).json(CreateAnalysisResponse.parse(serializeAnalysis(created)));
  } catch (error) {
    req.log.error({ error }, "AI project analysis failed");
    res.status(502).json({ error: "The AI reviewer could not complete this analysis." });
  }
});

router.post("/analyses/upload", upload.single("projectZip"), async (req, res): Promise<void> => {
  const file = req.file;
  const projectName = typeof req.body.projectName === "string" ? req.body.projectName.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";

  if (!file || !projectName || !description) {
    res.status(400).json({ error: "Project name, description, and a ZIP archive are required." });
    return;
  }
  if (!file.originalname.toLowerCase().endsWith(".zip")) {
    res.status(400).json({ error: "Upload the project as a .zip archive." });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "AI analysis is not configured on the server." });
    return;
  }

  try {
    const archiveEvidence = await readProjectArchive(file.buffer);
    const techStack =
      typeof req.body.techStack === "string"
        ? req.body.techStack.split(",").map((item: string) => item.trim()).filter(Boolean)
        : [];
    const goals =
      typeof req.body.goals === "string"
        ? req.body.goals.split("\n").map((item: string) => item.trim()).filter(Boolean)
        : [];
    const currentState =
      typeof req.body.currentState === "string" && req.body.currentState.trim()
        ? req.body.currentState.trim()
        : "The project was uploaded for a complete first-pass review.";
    const report = await generateAiReport({
      name: projectName,
      description,
      techStack,
      currentState,
      goals,
      codeContext: archiveEvidence,
    });
    const [created] = await db
      .insert(analysesTable)
      .values({
        name: projectName,
        description,
        techStack: techStack.length ? techStack : ["Inferred from archive"],
        status: "completed",
        score: report.score,
        grade: report.grade,
        executiveSummary: report.executiveSummary,
        recommendation: report.recommendation,
        strengths: report.strengths,
        categoryScores: report.categoryScores,
        findings: report.findings,
      })
      .returning();

    res.status(201).json(CreateAnalysisResponse.parse(serializeAnalysis(created)));
  } catch (error) {
    req.log.error({ error }, "AI archive analysis failed");
    res.status(502).json({ error: "The AI reviewer could not complete this archive analysis." });
  }
});

export default router;