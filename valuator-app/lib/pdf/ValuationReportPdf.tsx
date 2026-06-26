import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { AssetCategory, CATEGORY_LABELS, humanizeKey } from "@/lib/categories";

const INK_BLACK = "#0b0b12";
const GOLD = "#bb9d46";
const MUTED = "#5c5a52";
const BORDER = "#e7e1d2";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: INK_BLACK,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 12,
    marginBottom: 18,
  },
  letterhead: {
    fontSize: 16,
    fontWeight: 700,
    color: INK_BLACK,
  },
  letterheadSub: {
    fontSize: 8.5,
    color: MUTED,
    marginTop: 2,
  },
  docTitle: {
    fontSize: 9,
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaBlock: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 110,
    color: MUTED,
  },
  metaValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 6,
    color: INK_BLACK,
  },
  body: {
    lineHeight: 1.5,
  },
  table: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    padding: 6,
    fontWeight: 700,
    fontSize: 9,
    backgroundColor: "#f5f2ea",
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
  },
  colDescription: { flex: 2 },
  colPrice: { flex: 1 },
  colDate: { flex: 1 },
  colSize: { flex: 1 },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  photo: {
    width: 150,
    height: 112,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  boilerplate: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
  },
  signOffBlock: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  signOffRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  signOffLabel: {
    width: 90,
    color: MUTED,
  },
  signOffLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: INK_BLACK,
    minHeight: 16,
  },
});

export interface ComparableForPdf {
  description: string;
  salePrice: number;
  saleDate: string | null;
  sizeOrMetric: number | null;
}

export interface ValuationReportPdfProps {
  subjectTitle: string;
  assetCategory: AssetCategory;
  details: Record<string, string | number | null>;
  draftReport: string;
  comparables: ComparableForPdf[];
  photos: string[];
  generatedDate: string;
  valuerName: string | null;
  valuerRole: string | null;
}

export default function ValuationReportPdf({
  subjectTitle,
  assetCategory,
  details,
  draftReport,
  comparables,
  photos,
  generatedDate,
  valuerName,
  valuerRole,
}: ValuationReportPdfProps) {
  const detailEntries = Object.entries(details).filter(
    ([, v]) => v !== null && v !== ""
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.letterhead}>AVS</Text>
            <Text style={styles.letterheadSub}>
              Asset Valuation Specialists
            </Text>
          </View>
          <Text style={styles.docTitle}>Draft Valuation Report</Text>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Subject</Text>
            <Text style={styles.metaValue}>{subjectTitle}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Asset category</Text>
            <Text style={styles.metaValue}>
              {CATEGORY_LABELS[assetCategory]}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{generatedDate}</Text>
          </View>
          {detailEntries.map(([key, value]) => (
            <View style={styles.metaRow} key={key}>
              <Text style={styles.metaLabel}>{humanizeKey(key)}</Text>
              <Text style={styles.metaValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Basis of Value</Text>
        <Text style={styles.boilerplate}>
          This valuation is prepared on the basis of Market Value, defined per the
          International Valuation Standards (IVS) as the estimated amount for which
          the asset should exchange on the valuation date between a willing buyer and
          a willing seller in an arm&apos;s-length transaction, after proper
          marketing, wherein the parties had each acted knowledgeably, prudently, and
          without compulsion.
        </Text>

        <Text style={styles.sectionTitle}>Scope of Work</Text>
        <Text style={styles.boilerplate}>
          This report has been prepared for the sole use of the instructing client
          for the stated purpose and may not be relied upon by any other party
          without the valuer&apos;s prior written consent. The valuer has relied on
          the information, photographs, and details supplied by the instructing
          party and referenced comparable sales data, and has not independently
          verified title, legal description, encumbrances, or regulatory compliance
          unless expressly stated.
        </Text>

        <Text style={styles.body}>{draftReport}</Text>

        {comparables.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Comparable Sales</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeaderCell, styles.colDescription]}>
                  Description
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                  Sale Price
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colSize]}>
                  Size / Metric
                </Text>
              </View>
              {comparables.map((c, i) => (
                <View
                  style={
                    i === comparables.length - 1
                      ? styles.tableRowLast
                      : styles.tableRow
                  }
                  key={i}
                >
                  <Text style={[styles.tableCell, styles.colDescription]}>
                    {c.description}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    R{c.salePrice.toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {c.saleDate ?? "—"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colSize]}>
                    {c.sizeOrMetric ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {photos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {photos.map((src, i) => (
                <Image key={i} src={src} style={styles.photo} />
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Assumptions &amp; Limiting Conditions</Text>
        <Text style={styles.boilerplate}>
          No allowance has been made for costs of sale, taxation, or other
          liabilities that may arise on disposal of the subject asset. This
          valuation represents the valuer&apos;s opinion as at the effective date
          stated above and may not remain valid at any other date due to market
          fluctuations. Where comparable sales data is limited, the estimated value
          range should be treated as provisional pending verification of the items
          listed under Notes for the Valuer. This document is a draft for internal
          review unless and until signed off by a qualified valuer below.
        </Text>

        <View style={styles.signOffBlock}>
          <View style={styles.signOffRow}>
            <Text style={styles.signOffLabel}>Prepared by</Text>
            <Text style={styles.metaValue}>{valuerName ?? "—"}</Text>
          </View>
          <View style={styles.signOffRow}>
            <Text style={styles.signOffLabel}>Role</Text>
            <Text style={styles.metaValue}>{valuerRole ?? "—"}</Text>
          </View>
          <View style={styles.signOffRow}>
            <Text style={styles.signOffLabel}>Effective date</Text>
            <Text style={styles.metaValue}>{generatedDate}</Text>
          </View>
          <View style={styles.signOffRow}>
            <Text style={styles.signOffLabel}>Signature</Text>
            <View style={styles.signOffLine} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Draft for internal review — not a final report.</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
