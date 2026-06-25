import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ComparableSaleInput {
  address: string;
  salePrice: number;
  saleDate: string | null;
  sizeSqm: number | null;
  notes: string | null;
}

export interface ValuationDraftInput {
  propertyAddress: string;
  propertyType: string;
  buildingSizeSqm: number | null;
  landSizeSqm: number | null;
  yearBuilt: number | null;
  conditionNotes: string | null;
  comparables: ComparableSaleInput[];
}

function buildPrompt(input: ValuationDraftInput): string {
  const comparablesText = input.comparables.length
    ? input.comparables
        .map(
          (c, i) =>
            `${i + 1}. ${c.address} — sold for R${c.salePrice.toLocaleString()}` +
            `${c.saleDate ? ` on ${c.saleDate}` : ""}` +
            `${c.sizeSqm ? `, ${c.sizeSqm} sqm` : ""}` +
            `${c.notes ? ` (${c.notes})` : ""}`
        )
        .join("\n")
    : "No comparable sales provided.";

  return `You are an experienced property valuer in South Africa drafting a first-draft valuation report for internal review. Write a professional, factual draft based ONLY on the information given below. Do not invent data not provided. Flag clearly where the valuer needs to verify or add information.

Subject property:
- Address: ${input.propertyAddress}
- Type: ${input.propertyType}
- Building size: ${input.buildingSizeSqm ? `${input.buildingSizeSqm} sqm` : "not provided"}
- Land size: ${input.landSizeSqm ? `${input.landSizeSqm} sqm` : "not provided"}
- Year built: ${input.yearBuilt ?? "not provided"}
- Condition notes: ${input.conditionNotes ?? "not provided"}

Comparable sales:
${comparablesText}

Write the draft with these sections:
1. Property Description
2. Valuation Methodology (reference the comparable sales approach, since comparables were provided)
3. Analysis of Comparables
4. Estimated Value Range (a reasoned range in ZAR, based on the comparables; state assumptions clearly)
5. Notes for the Valuer (anything missing or that needs to be verified before finalising)

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
