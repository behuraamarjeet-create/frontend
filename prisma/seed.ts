// ============================================================
// AI Tender Compliance Platform — Database Seed
// Run with: bun prisma/seed.ts   (after `bun run db:push`)
// Uses the shared verification engine so seed data matches
// live verification output for checked bidders.
// ============================================================

import { PrismaClient } from "@prisma/client";
import {
  auditMessageFor,
  checkTemplate,
  persistVerificationResult,
  runVerificationForBidder,
  MODEL_LABEL,
} from "../src/lib/verification";
import type { VerificationOutcome } from "../src/lib/verification";

const db = new PrismaClient();

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * DAY_MS);

type CheckName =
  | "GST Registration"
  | "PAN Compliance"
  | "Udyam / MSME"
  | "EPFO Compliance"
  | "ESIC Compliance"
  | "Startup India (DPIIT)"
  | "NSIC Registration"
  | "Blacklist / Debarment";

interface BidderSpec {
  contactName: string;
  company: string;
  gstin: string;
  pan: string;
  mode: "PENDING" | "RUN" | "ENSURE_QUALIFY" | "ENSURE_CLARIFY" | "FORCE_BLACKLIST_FAIL";
  lastCheckedDaysAgo?: number;
  confidence?: number;
  withPendingDoc?: boolean;
}

interface TenderSpec {
  code: string;
  title: string;
  department: string;
  category: string;
  status: "OPEN" | "CLOSED";
  publishedAt: Date;
  closesAt: Date;
  value: string;
  bidders: BidderSpec[];
}

const TENDERS: TenderSpec[] = [
  {
    code: "TND-2024-001",
    title: "Supply of IT Hardware and Networking Equipment",
    department: "Ministry of Electronics & IT",
    category: "IT",
    status: "OPEN",
    publishedAt: new Date("2026-08-01T09:30:00.000Z"),
    closesAt: new Date("2026-09-15T18:00:00.000Z"),
    value: "₹18 Cr",
    bidders: [
      { contactName: "Priya Nair", company: "Nair Systems LLP", gstin: "27AAAAA3333A1Z3", pan: "AAAAA3333A", mode: "RUN", lastCheckedDaysAgo: 5 },
      { contactName: "Deepak Agarwal", company: "Agarwal Office Solutions", gstin: "27CCCCC4444C1Z1", pan: "CCCCC4444C", mode: "RUN", lastCheckedDaysAgo: 3 },
      { contactName: "Rekha Joshi", company: "Joshi Digital Supplies", gstin: "27DDDDD6666D1Z2", pan: "DDDDD6666D", mode: "RUN", lastCheckedDaysAgo: 4 },
      { contactName: "Vikram Singh", company: "Singh Traders", gstin: "27EEEEE7777E1Z1", pan: "EEEEE7777E", mode: "PENDING", withPendingDoc: true },
      { contactName: "Anita Desai", company: "Desai Enterprises", gstin: "27FFFFF8888F1Z9", pan: "FFFFF8888F", mode: "PENDING" },
    ],
  },
  {
    code: "TND-2024-002",
    title: "Civil Construction Works for District Warehouse",
    department: "Ministry of Rural Development",
    category: "Construction",
    status: "OPEN",
    publishedAt: new Date("2026-08-05T10:00:00.000Z"),
    closesAt: new Date("2026-09-30T18:00:00.000Z"),
    value: "₹64 Cr",
    bidders: [
      { contactName: "Manoj Verma", company: "Verma Constructions", gstin: "27MMMMM3333M1Z5", pan: "MMMMM3333M", mode: "PENDING" },
      { contactName: "Farhan Khan", company: "Khan Infra Projects", gstin: "27NNNNN4444N1Z6", pan: "NNNNN4444N", mode: "PENDING", withPendingDoc: true },
      { contactName: "Lakshmi Nair", company: "BuildRight Infra", gstin: "27OOOOO5555O1Z7", pan: "OOOOO5555O", mode: "RUN", lastCheckedDaysAgo: 8 },
      { contactName: "Pooja Sharma", company: "Sharma & Associates", gstin: "27PPPPP6666P1Z8", pan: "PPPPP6666P", mode: "PENDING" },
    ],
  },
  {
    code: "TND-2024-003",
    title: "Supply of Medical Equipment to PHCs",
    department: "Ministry of Health & Family Welfare",
    category: "Health",
    status: "OPEN",
    publishedAt: new Date("2026-08-10T11:15:00.000Z"),
    closesAt: new Date("2026-10-05T18:00:00.000Z"),
    value: "₹27 Cr",
    bidders: [
      { contactName: "Ravi Shankar", company: "Risky Traders Pvt Ltd", gstin: "27QQQQ1234Q1Z9", pan: "QQQPQ1234Q", mode: "PENDING", withPendingDoc: true },
      { contactName: "Kavitha Reddy", company: "National Infrastructure Ltd", gstin: "27PPPP9876P1Z4", pan: "PPPPP9876P", mode: "PENDING" },
      { contactName: "Suresh Pillai", company: "Dubious Contractors", gstin: "27ZZZZ4321Z1Z2", pan: "ZZZZZ4321Z", mode: "PENDING" },
      { contactName: "Nisha Kulkarni", company: "SlowPay Enterprises", gstin: "27MMMM5678M1Z3", pan: "MMMMM5678M", mode: "PENDING", withPendingDoc: true },
      { contactName: "Amit Tripathi", company: "Sunrise Tech Pvt Ltd", gstin: "27AAAAA1111A1Z1", pan: "AAAAA1111A", mode: "PENDING" },
      { contactName: "Geeta Iyer", company: "Coastline Engineering", gstin: "27BBBBB2222B1Z2", pan: "BBBBB2222B", mode: "PENDING" },
      { contactName: "Dr. Mohan Das", company: "TechServe Solutions Pvt Ltd", gstin: "27AABCU9603R1Z5", pan: "AABCU9603R", mode: "ENSURE_QUALIFY", lastCheckedDaysAgo: 2, confidence: 95 },
      { contactName: "Pallavi Menon", company: "Menon Pharma Distributors", gstin: "27LLLLL5555L1Z1", pan: "LLLLL5555L", mode: "ENSURE_CLARIFY", lastCheckedDaysAgo: 1 },
    ],
  },
  {
    code: "TND-2024-004",
    title: "IT Infrastructure Upgrade — State Data Centre",
    department: "Dept. of Information Technology",
    category: "IT",
    status: "CLOSED",
    publishedAt: new Date("2026-04-01T09:00:00.000Z"),
    closesAt: new Date("2026-07-31T18:00:00.000Z"),
    value: "₹55 Cr",
    bidders: [
      { contactName: "Sanjay Gupta", company: "Gupta & Sons", gstin: "27QQQQQ7777Q1Z9", pan: "QQQQQ7777Q", mode: "FORCE_BLACKLIST_FAIL", lastCheckedDaysAgo: 10 },
      { contactName: "Meera Krishnan", company: "Kryon Systems", gstin: "27RRRRR8888R1Z1", pan: "RRRRR8888R", mode: "RUN", lastCheckedDaysAgo: 7 },
      { contactName: "Rohan Bhatt", company: "Bhatt Technologies", gstin: "27SSSSS9999S1Z2", pan: "SSSSS9999S", mode: "PENDING", withPendingDoc: true },
    ],
  },
  {
    code: "TND-2024-005",
    title: "Solar Power Plant Installation — Government Buildings",
    department: "Ministry of New & Renewable Energy",
    category: "Energy",
    status: "OPEN",
    publishedAt: new Date("2026-08-12T08:45:00.000Z"),
    closesAt: new Date("2026-10-15T18:00:00.000Z"),
    value: "₹96 Cr",
    bidders: [
      { contactName: "Arjun Mehta", company: "Mehta Green Energy", gstin: "27GGGGG9999G1Z1", pan: "GGGGG9999G", mode: "RUN", lastCheckedDaysAgo: 6 },
      { contactName: "Sunita Rao", company: "Rao Solar Pvt Ltd", gstin: "27HHHHH0000H1Z2", pan: "HHHHH0000H", mode: "PENDING" },
      { contactName: "Kiran Patel", company: "Patel Power Solutions", gstin: "27JJJJJ1111J1Z3", pan: "JJJJJ1111J", mode: "PENDING", withPendingDoc: true },
      { contactName: "Rajesh Kumar", company: "Kumar Electricals", gstin: "27KKKKK2222K1Z4", pan: "KKKKK2222K", mode: "PENDING" },
    ],
  },
];

const DOC_SETS: { name: string; type: string; size: string }[][] = [
  [
    { name: "GST-Certificate.pdf", type: "PDF", size: "1.2 MB" },
    { name: "Company-Registration.pdf", type: "PDF", size: "840 KB" },
    { name: "MSME-Udyam-Certificate.pdf", type: "PDF", size: "640 KB" },
  ],
  [
    { name: "GST-Certificate.pdf", type: "PDF", size: "1.2 MB" },
    { name: "PAN-Card.pdf", type: "PDF", size: "210 KB" },
  ],
  [
    { name: "Company-Registration.pdf", type: "PDF", size: "840 KB" },
    { name: "Technical-Proposal.pdf", type: "PDF", size: "3.4 MB" },
    { name: "GST-Certificate.pdf", type: "PDF", size: "1.2 MB" },
  ],
];

async function seedCheckedBidder(
  tender: { id: string; code: string },
  spec: BidderSpec,
  docSetIndex: number
): Promise<{ bidderId: string; outcome: VerificationOutcome }> {
  const bidder = await db.bidder.create({
    data: {
      tenderId: tender.id,
      contactName: spec.contactName,
      company: spec.company,
      gstin: spec.gstin,
      pan: spec.pan,
      status: "PROCESSING",
    },
  });

  const ctx = { company: spec.company, gstin: spec.gstin, pan: spec.pan };
  let outcome = await runVerificationForBidder(bidder.id);

  const rerun = (forceChecks: Partial<Record<CheckName, object>>) =>
    runVerificationForBidder(bidder.id, { forceChecks: forceChecks as never });

  if (spec.mode === "ENSURE_QUALIFY" && outcome.recommendation !== "QUALIFY") {
    const forceChecks: Partial<Record<CheckName, object>> = {
      "GST Registration": checkTemplate("GST Registration", "PASS", ctx),
    };
    const bl = outcome.checks.find((c) => c.name === "Blacklist / Debarment");
    if (bl?.status === "FAIL") {
      forceChecks["Blacklist / Debarment"] = checkTemplate("Blacklist / Debarment", "PASS", ctx);
    }
    outcome = await rerun(forceChecks);
  }

  if (spec.mode === "ENSURE_CLARIFY") {
    if (outcome.recommendation !== "CLARIFY") {
      outcome = await rerun({
        "GST Registration": checkTemplate("GST Registration", "REVIEW", ctx),
      });
    }
    if (outcome.score >= 60) {
      outcome = await rerun({
        "GST Registration": checkTemplate("GST Registration", "REVIEW", ctx),
        "Startup India (DPIIT)": checkTemplate("Startup India (DPIIT)", "NA", ctx),
      });
    }
  }

  if (spec.mode === "FORCE_BLACKLIST_FAIL") {
    outcome = await rerun({
      "Blacklist / Debarment": checkTemplate("Blacklist / Debarment", "FAIL", ctx),
    });
  }

  if (spec.lastCheckedDaysAgo !== undefined) {
    outcome.lastCheckedAt = daysAgo(spec.lastCheckedDaysAgo);
  }
  if (spec.confidence !== undefined) {
    outcome.confidence = spec.confidence;
  }

  await persistVerificationResult(bidder.id, outcome);

  // Documents for checked bidders (VERIFIED / MANUAL_REVIEW / REJECTED)
  const docSet = DOC_SETS[docSetIndex % DOC_SETS.length];
  for (let i = 0; i < docSet.length; i++) {
    const d = docSet[i];
    await db.bidderDocument.create({
      data: {
        bidderId: bidder.id,
        name: d.name,
        type: d.type,
        size: d.size,
        uploadedAt: daysAgo(7 + ((docSetIndex * 3 + i * 5) % 15)),
      },
    });
  }

  await db.auditEntry.create({
    data: {
      action: "VERIFICATION_COMPLETE",
      message: auditMessageFor(outcome.recommendation),
      bidderName: spec.company,
      bidderId: bidder.id,
      tenderCode: tender.code,
      score: outcome.score,
      model: MODEL_LABEL,
      officer: "Procurement Officer",
      createdAt: outcome.lastCheckedAt,
    },
  });

  return { bidderId: bidder.id, outcome };
}

async function main() {
  console.log("Seeding AI Tender Compliance Platform …");

  // wipe existing rows (children first)
  await db.auditEntry.deleteMany();
  await db.bidderDocument.deleteMany();
  await db.complianceCheck.deleteMany();
  await db.bidder.deleteMany();
  await db.tender.deleteMany();

  let docSetIndex = 0;
  const sanjay = { id: "", lastCheckedAt: new Date(0) };

  for (const t of TENDERS) {
    const tender = await db.tender.create({
      data: {
        code: t.code,
        title: t.title,
        department: t.department,
        category: t.category,
        status: t.status,
        publishedAt: t.publishedAt,
        closesAt: t.closesAt,
        value: t.value,
      },
    });

    for (const spec of t.bidders) {
      if (spec.mode === "PENDING") {
        await db.bidder.create({
          data: {
            tenderId: tender.id,
            contactName: spec.contactName,
            company: spec.company,
            gstin: spec.gstin,
            pan: spec.pan,
            status: "PENDING",
            ...(spec.withPendingDoc
              ? {
                  documents: {
                    create: {
                      name: "Technical-Specs.pdf",
                      type: "PDF",
                      size: "2.1 MB",
                      uploadedAt: daysAgo(5 + Math.floor(Math.random() * 4)),
                    },
                  },
                }
              : {}),
          },
        });
        continue;
      }

      const { bidderId, outcome } = await seedCheckedBidder(
        { id: tender.id, code: t.code },
        spec,
        docSetIndex++
      );
      console.log(
        `  ${t.code} · ${spec.company} → ${outcome.status} / ${outcome.recommendation} / score ${outcome.score} / risk ${outcome.risk}`
      );

      if (spec.mode === "FORCE_BLACKLIST_FAIL") {
        sanjay.id = bidderId;
        sanjay.lastCheckedAt = outcome.lastCheckedAt;
      }
    }
  }

  // Officer decision audit for Sanjay Gupta (forced blacklist fail → DISQUALIFY)
  if (sanjay.id) {
    await db.auditEntry.create({
      data: {
        action: "OFFICER_DECISION",
        message: "Officer decision — DISQUALIFY",
        decision: "DISQUALIFY",
        bidderName: "Gupta & Sons",
        bidderId: sanjay.id,
        tenderCode: "TND-2024-004",
        score: 0,
        officer: "Procurement Officer",
        createdAt: new Date(sanjay.lastCheckedAt.getTime() + 3 * HOUR_MS),
      },
    });
  }

  // Recent session entry
  await db.auditEntry.create({
    data: {
      action: "SESSION",
      message: "Officer signed in",
      officer: "Procurement Officer",
      createdAt: new Date(now - 2 * 60_000),
    },
  });

  const [tenders, bidders, checks, documents, audits] = await Promise.all([
    db.tender.count(),
    db.bidder.count(),
    db.complianceCheck.count(),
    db.bidderDocument.count(),
    db.auditEntry.count(),
  ]);
  console.log({ tenders, bidders, checks, documents, audits });
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
