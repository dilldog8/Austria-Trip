import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssetCategory, CATEGORY_LABELS, humanizeKey } from "@/lib/categories";

export interface ComparableSaleInput {
  description: string;
  salePrice: number;
  saleDate: string | null;
  sizeOrMetric: number | null;
  notes: string | null;
}

export interface ValuationDraftInput {
  assetCategory: AssetCategory;
  subjectTitle: string;
  details: Record<string, string | number | null>;
  comparables: ComparableSaleInput[];
}

const METHODOLOGY_HINTS: Record<AssetCategory, string> = {
  property:
    "Use the comparable sales approach, drawing directly on the comparable sales provided.",
  plant_machinery:
    "Use a depreciated replacement cost approach combined with a market approach informed by the comparable sales provided (accounting for hours used / age where relevant).",
  motor_vehicle:
    "Use a market comparison approach, adjusting for mileage, age, and condition relative to the comparable sales provided.",
  art_collectibles:
    "Use a market approach based on comparable auction/sale results, weighing provenance, condition, and medium.",
};

function formatDetails(details: Record<string, string | number | null>): string {
  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== "");
  if (!entries.length) return "Not provided.";
  return entries.map(([k, v]) => `- ${humanizeKey(k)}: ${v}`).join("\n");
}

function buildPrompt(input: ValuationDraftInput): string {
  const comparablesText = input.comparables.length
    ? input.comparables
        .map(
          (c, i) =>
            `${i + 1}. ${c.description} — sold for R${c.salePrice.toLocaleString()}` +
            `${c.saleDate ? ` on ${c.saleDate}` : ""}` +
            `${c.sizeOrMetric ? `, ${c.sizeOrMetric}` : ""}` +
            `${c.notes ? ` (${c.notes})` : ""}`
        )
        .join("\n")
    : "No comparable sales provided.";

  return `You are an experienced valuer in South Africa drafting a first-draft ${CATEGORY_LABELS[
    input.assetCategory
  ].toLowerCase()} valuation report for internal review. Write a professional, factual draft based ONLY on the information given below. Do not invent data not provided. Flag clearly where the valuer needs to verify or add information.

Subject: ${input.subjectTitle}
Asset category: ${CATEGORY_LABELS[input.assetCategory]}

Details:
${formatDetails(input.details)}

Comparable sales:
${comparablesText}

Write the draft with these sections, numbered as below:
1. Description
2. Valuation Methodology (${METHODOLOGY_HINTS[input.assetCategory]})
3. Analysis of Comparables
4. Estimated Value Range (a reasoned range in ZAR; state assumptions clearly)
5. Notes for the Valuer (anything missing or that needs to be verified before finalising)

Formatting rules: plain text only. Do not use markdown — no asterisks, no "**bold**", no "#" headers, no markdown bullet points. For lists, use a plain dash "-" or a number followed by a period. This text will be edited and exported as a document, so it must read cleanly as plain text.

Keep it concise and professional. This is a draft for the valuer to edit, not a final report.`;
}

export async function generateValuationDraft(
  input: ValuationDraftInput
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(buildPrompt(input));
  return result.response.text();
}
