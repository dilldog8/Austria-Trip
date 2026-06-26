import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
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
  generatedDate: string;
}

export default function ValuationReportPdf({
  subjectTitle,
  assetCategory,
  details,
  draftReport,
  comparables,
  generatedDate,
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
