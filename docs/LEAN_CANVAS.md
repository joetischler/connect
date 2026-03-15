# LEAN CANVAS: Patient Financial Resolution Platform

*Working Name: Mercy (or TBD)*
*"PayZen for terminal debt" — AI-powered empathetic resolution of written-off healthcare debt*

---

## High-Level Concept

**"What if collections agencies actually helped people instead of threatening them?"**

An AI-powered platform that works on behalf of health systems to resolve written-off patient debt — not through adversarial tactics, but by triaging WHY each person hasn't paid and routing them to the right resolution: payment plans, financial assistance, insurance recovery, charity care, or Medicaid eligibility.

**X for Y**: TrueAccord's AI-first collections engine + PayZen's empathetic patient financing — applied specifically to **terminal/written-off healthcare debt** with a multi-path resolution model.

---

## 1. PROBLEM

### Problem #1: $88B in medical debt is stuck in a broken collections system
- $88 billion of outstanding medical bills currently sit in collections, affecting 1 in 5 Americans
- Providers collect **less than 50%** of billed patient responsibility (MGMA)
- Bad debt and charity care are **up 32% since 2022** in large hospitals (Kaufman Hall, March 2025)
- Hospital CFOs see bad debt as a growing, unsolvable problem — elevated levels expected to persist through 2025+

### Problem #2: Traditional collections destroys the patient-provider relationship
- Collections agencies use one playbook for every situation: "pay or else"
- But **87% of bad debt comes from insured patients** who couldn't cover out-of-pocket costs (Cleveland Clinic, 2024), not people gaming the system
- Health systems risk brand damage by sending patients to adversarial agencies
- Many patients avoid seeking future care at the same system — revenue lost permanently

### Problem #3: The real reason people don't pay is never investigated
- Self-pay after insurance now accounts for **58% of bad debt** (up from 11% in 2018 — Crowe)
- Claims denial rates up **7.6% YoY**, denial write-offs up **33.3%** (Kodiak Solutions) — many of these are insurance failures, not patient failures
- Patients may qualify for financial assistance, charity care, Medicaid retroactive eligibility, or No Surprises Act protections — but nobody checks
- Health systems get zero data back on WHY patients don't pay, so they can't fix upstream issues

---

## 2. CUSTOMER SEGMENTS

### Primary Customer: Health Systems & Hospitals
- **CFOs and VP of Revenue Cycle** at mid-to-large health systems (200+ beds)
- Have significant portfolios of written-off/terminal patient debt
- Under pressure to improve margins (average hospital margin ~2-3%)
- Sensitive to brand/reputation risk from aggressive collections
- Currently using traditional collection agencies or writing debt off entirely

### Secondary Customer: Large Physician Groups & Specialty Practices
- Multi-location specialty groups (orthopedics, cardiology, oncology) with high out-of-pocket costs
- Surgical centers where procedures carry $5K-$50K+ patient responsibility
- Frustrated with low collection rates on patient balances

### Tertiary (Future): Health Plans
- Interested in patient financial navigation to reduce downstream utilization avoidance
- Could sponsor the service as a member benefit

### Early Adopter Profile
A **mid-size health system (3-10 hospitals, $1B-$5B revenue)** with:
- A CFO who understands the collections problem is broken
- An existing portfolio of $10M+ in written-off patient debt they've given up on
- Willingness to try a new approach on "already dead" accounts (low risk since it's written off)
- Ideally a system that has already tried and been dissatisfied with traditional agencies
- Bonus: A system that already sends HL7v2 ADT feeds (most do)

---

## 3. UNIQUE VALUE PROPOSITION

### Single Clear Statement:
> **"We recover written-off patient debt by actually helping patients — and tell you why they couldn't pay in the first place."**

### Supporting Points:
- **For health systems**: Pure upside on debt you've already written off, with zero brand risk
- **For patients**: Someone who listens, helps navigate options, and treats them with dignity
- **For the industry**: Data on the root causes of medical debt, enabling upstream fixes

### Why Now:
1. Bad debt at historic highs (32% increase since 2022) and rising
2. AI agent technology now capable of empathetic, multi-turn conversations at scale
3. 40%+ of working-age people in high-deductible plans — patient responsibility is structural, not going away
4. CFPB Regulation V (medical debt credit reporting ban) struck down July 2025 — regulatory landscape stabilizing
5. PayZen/Cedar proving the market for AI-powered patient financial engagement ($15M+ raised)

---

## 4. SOLUTION

### Solution #1: AI-Powered Patient Triage & Resolution Engine
- AI agents conduct personalized outreach (SMS, email, voice) on behalf of the health system
- First interaction is diagnostic, not demanding: "We're reaching out from [Health System] about your account. We'd like to understand your situation and see how we can help."
- Agent triages each patient into resolution buckets:
  - **Forgot / lost mail** → re-engage, offer easy payment
  - **Card declined / payment method issue** → update and process
  - **Can't afford full amount** → personalized payment plan (PayZen-style affordability assessment)
  - **Should qualify for financial assistance** → connect to hospital charity care / financial assistance programs
  - **Insurance should have paid** → flag for insurance recovery (completely different workflow)
  - **Eligible for Medicaid retroactively** → assist with enrollment, potentially zeroing out balance
  - **No Surprises Act violation** → flag and escalate
  - **Genuinely unable to pay** → recommend forgiveness, provide data back to health system

### Solution #2: Insurance Recovery & Denial Remediation
- When triage reveals the patient's balance stems from a denied claim or insurance error, pivot from patient collections to payer recovery
- Analyze EOB data, identify denial reasons, file appeals or resubmit claims
- This is a **fundamentally different revenue stream** — recovering from payers at full contracted rates vs. collecting pennies from patients
- Health systems often miss this because the debt has been written off and nobody re-examines the insurance pathway

### Solution #3: Root Cause Analytics Dashboard
- Every patient interaction produces structured data on WHY they didn't pay
- Aggregate across portfolio: "42% of your bad debt is from patients who qualify for your financial assistance program but were never screened"
- Actionable insights: "Denial rate from [Payer X] is 3x the average — their prior auth requirements changed and your team hasn't updated workflows"
- Enable health systems to fix upstream billing, financial screening, and insurance verification processes
- This data has never existed before — no collections agency reports it

---

## 5. CHANNELS

### Path to First Customers:
1. **Direct relationships with health system CFOs** — founder's existing network in healthcare
2. **HFMA (Healthcare Financial Management Association)** — conferences, publications, member directory (primary industry association for healthcare finance leaders)
3. **Revenue Cycle conferences** — HFMA Annual Conference, HIMSS (for the tech angle), Becker's Hospital Review events
4. **Case study / pilot program** — land one health system, prove the model, publish results
5. **Health system innovation programs** — many large systems have innovation arms looking for new approaches

### Scaling Channels:
6. **Consulting firms as referrers** — Kaufman Hall, Crowe, Kodiak Solutions (they advise CFOs on exactly this problem)
7. **EHR vendor partnerships** — Epic, Cerner/Oracle Health marketplace listings
8. **Content marketing** — publish the ROOT CAUSE DATA (anonymized/aggregated) as industry reports, establishing thought leadership
9. **Health system peer networks** — CFOs talk to each other; one successful pilot creates word-of-mouth

---

## 6. REVENUE STREAMS

### Primary: Contingency Fee on Recovered Patient Debt
- **Rate**: 15-25% of recovered amount (below industry standard 25-40% for traditional agencies)
- Lower rate justified by AI cost structure + empathetic approach makes it an easy sell
- **Example**: Health system has $20M in written-off debt. Platform recovers $4M (20% recovery rate). At 20% contingency = **$800K revenue** from a single client.
- Multiple health system clients with $10M-$100M+ in terminal debt each

### Secondary: Insurance Recovery Fee
- **Rate**: 10-15% of payer recovery (or flat fee per successful appeal)
- Higher margin because recovery is from payers at contracted rates (often $2-10x patient responsibility amount)
- **Example**: Discover $2M in denied claims that should have been paid. Recover $1.5M from payers. At 12% = **$180K revenue**
- This alone could justify the platform for some health systems

### Tertiary: Analytics & Insights Subscription
- Monthly SaaS fee for the root cause dashboard: **$5K-$25K/month** based on system size
- Ongoing value even after initial portfolio is worked through
- Feeds into upstream process improvement

### Revenue Model Math (Single Mid-Size Health System):
| Stream | Assumption | Annual Revenue |
|--------|-----------|---------------|
| Patient debt recovery | $30M portfolio x 20% recovery x 20% fee | $1.2M |
| Insurance recovery | $5M in recoverable denials x 75% success x 12% fee | $450K |
| Analytics subscription | $15K/month | $180K |
| **Total per client** | | **~$1.8M/year** |

### Market Sizing (Bottom-Up):
- ~6,000 hospitals in U.S., ~2,000 with 200+ beds
- Target 50 health systems in Year 3 at average $1M/year = **$50M ARR**
- TAM: $88B in outstanding medical collections x 20% recovery x 20% fee = **$3.5B addressable**

---

## 7. COST STRUCTURE

### Major Cost Drivers:

| Category | Details | Est. % of Revenue |
|----------|---------|-------------------|
| **AI/LLM compute** | GPT-4/Claude API calls for patient interactions, triage, and analysis. Estimated $0.10-$0.50 per patient interaction round. At scale (100K interactions/month) = $10K-$50K/month | 5-10% |
| **Communication infrastructure** | Twilio (SMS, voice), SendGrid (email), phone number provisioning. SMS ~$0.01/msg, voice ~$0.02/min | 3-5% |
| **Engineering team** | 3-5 engineers initially (full-stack, AI/ML, healthcare domain). $150K-$250K fully loaded each | 25-35% (early stage) |
| **Compliance & licensing** | State collection agency licenses ($500-$10K per state), HIPAA compliance (SOC 2 Type II audit ~$50K), legal counsel | 5-10% |
| **Infrastructure** | PostgreSQL (RDS/Aurora), NATS, compute (ECS/EKS), S3 storage. HIPAA-eligible AWS = premium | 3-5% |
| **Insurance recovery specialists** | For complex payer appeals, may need 1-3 human specialists initially before AI can handle | 5-10% |
| **Sales & account management** | Enterprise sales cycle requires dedicated reps + customer success | 15-20% |

### Key Unit Economics:
- **Cost to work a patient account**: $2-$10 (AI-powered) vs. $50-$200 (human collections agent)
- **Gross margin target**: 60-70% at scale (vs. traditional collections agencies at 30-40%)
- **Payback on client acquisition**: Recover cost within first quarter of debt recovery

---

## 8. KEY METRICS

### North Star Metric:
**Dollars Resolved Per Patient Account** (not just collected — includes insurance recovery, financial assistance enrollment, and forgiveness recommendations)

### Funnel Metrics:
| Metric | Description | Target |
|--------|-------------|--------|
| **Contact Rate** | % of patients successfully reached | >60% (vs. industry ~30%) |
| **Engagement Rate** | % of contacted patients who interact | >40% |
| **Resolution Rate** | % of engaged patients with a resolution path identified | >80% |
| **Recovery Rate** | % of terminal debt portfolio recovered (all paths) | >20% (vs. industry 5-10% on terminal) |
| **Patient Satisfaction (NPS)** | Patient sentiment after interaction | >30 (vs. negative for traditional collections) |

### Business Health Metrics:
| Metric | Description |
|--------|-------------|
| **Revenue per client** | Average annual revenue per health system |
| **Client retention** | Year-over-year renewal rate (target >90%) |
| **Time to first recovery** | Days from portfolio ingestion to first dollar recovered |
| **Insurance recovery discovery rate** | % of patient accounts where insurance should have paid |
| **Root cause data completeness** | % of accounts with structured reason code for non-payment |
| **Cost per dollar recovered** | Operating cost to recover $1 (target <$0.15) |

### Leading Indicators:
- Number of health systems in pilot
- Size of debt portfolios under management
- AI agent accuracy on triage categorization
- State licenses obtained (gates new geographies)

---

## 9. UNFAIR ADVANTAGE

### What Can't Be Easily Copied:

1. **Real-Time Clinical Data Integration (Connect Platform)**
   - The existing Connect platform provides a working HL7v2 ADT/SIU parser, organizational hierarchy model, NATS messaging, and HIPAA audit logging
   - This enables **trigger-based outreach** — knowing when a patient with outstanding debt is back in the system (admitted, scheduled, discharged) and timing contact accordingly
   - Traditional collections agencies have ZERO access to real-time clinical event data
   - Building this integration layer from scratch takes 12-18 months

2. **Proprietary Root Cause Dataset**
   - Every patient interaction produces structured data on WHY they didn't pay
   - Over time, this becomes the largest dataset of medical debt root causes in the industry
   - Enables predictive models: "Patients with [characteristics] at [health system type] in [geography] are 73% likely to have [resolution path]"
   - This data doesn't exist anywhere — nobody collects it today
   - Network effect: more data -> better triage -> higher recovery -> more clients -> more data

3. **Regulatory Head Start & Licensing Portfolio**
   - State-by-state collection agency licensing is tedious and expensive ($500-$10K per state)
   - Once obtained, licenses create a meaningful barrier — especially multi-state coverage
   - Early compliance with FDCPA Regulation F digital standards, No Surprises Act, HIPAA — purpose-built, not retrofitted

4. **Empathetic Brand as Moat**
   - Health systems won't switch from an empathetic resolution partner to an adversarial one, even if the adversarial one recovers slightly more
   - Patient NPS and brand protection become contractual KPIs
   - Switching cost is high because the health system's brand is attached to the outreach

---

## EXISTING ALTERNATIVES (What They Do Today)

| Alternative | What They Do | Limitation |
|-------------|-------------|------------|
| **Traditional Collections Agencies** (Americollect, IC System, NPAS) | Letters, calls, threats, credit reporting | Adversarial, low recovery on terminal debt (5-10%), damages patient relationship, no data feedback |
| **Write It Off** | Accept the loss, take the tax deduction | Leaves money on the table, no learning, growing problem (32% increase) |
| **PayZen** | AI-powered payment plans for active patient responsibility | Focuses on **preventing** bad debt, not recovering terminal/written-off debt. Doesn't do insurance recovery. |
| **Cedar** | Digital billing platform with patient portal | Early-stage collections, not terminal debt. Digital-first but still payment-focused, not resolution-focused. |
| **TrueAccord** | AI collections platform (cross-industry) | Not healthcare-specific, no insurance recovery, no clinical data integration, no empathetic resolution model |
| **In-House Revenue Cycle Teams** | Internal staff work patient accounts | Understaffed, overwhelmed, focus on active AR not terminal debt. Can't scale to work written-off portfolios. |
| **Denials Management Vendors** (Waystar, Change Healthcare) | Manage insurance denials proactively | Work on active claims, not terminal debt. Don't do patient outreach or resolution. |

### The Gap:
Nobody is combining **AI-powered empathetic patient outreach** + **insurance recovery** + **root cause analytics** specifically on **terminal/written-off** healthcare debt. The existing players are either adversarial (traditional agencies), prevention-focused (PayZen/Cedar), or not healthcare-specific (TrueAccord).

---

## RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|------------|
| **State licensing delays** | HIGH | Start with states that have simpler requirements (e.g., Michigan has no standalone license). Identify 5-10 "fast path" states. Consider launching as a technology platform (not a collection agency) with a licensed partner initially. |
| **Health system sales cycle (6-12 months)** | HIGH | Target written-off debt portfolios — low risk for the buyer since it's "already dead" money. Offer pilot on a small portfolio with contingency-only pricing (no upfront cost). |
| **AI compliance with FDCPA** | MEDIUM | Build compliance into the agent architecture (call frequency limits, required disclosures, opt-out handling). Human-in-the-loop for edge cases. Log everything for audit. |
| **Recovery rates lower than projected** | MEDIUM | Terminal debt by definition has low recovery rates. Even 10-15% on a large portfolio is significant revenue. Insurance recovery path provides higher-probability revenue stream. |
| **Patient pushback / complaints** | LOW | Empathetic-first design. Easy opt-out. Patient satisfaction as a KPI. This is the whole differentiator — if patients hate it, the product has failed. |
| **HIPAA breach** | LOW (high impact) | Connect platform already designed for HIPAA (immutable audit log, encrypted at rest/transit, BAA framework). SOC 2 Type II audit in Year 1. |
| **Regulatory changes (CFPB)** | MEDIUM | Regulation V was struck down but political winds shift. Design to be compliant regardless — if credit reporting is banned, empathetic resolution becomes even more valuable (only carrot, no stick). |

---

## NEXT STEPS TO VALIDATE

1. **Customer Discovery (Week 1-4)**: 10+ conversations with health system CFOs/VPs of Revenue Cycle. Validate: Do they have terminal debt portfolios they'd let you work? What are they spending on collections today? What's their biggest frustration?

2. **Licensing Research (Week 1-4)**: Map out state-by-state requirements. Identify the fastest path to operating legally in 3-5 states. Explore "technology platform + licensed partner" model as a faster alternative.

3. **Pilot Design (Week 4-8)**: Design a minimum viable pilot — ingest a CSV of written-off accounts, run AI triage, conduct outreach, measure recovery. What's the smallest version that proves the thesis?

4. **Unit Economics Validation (Week 4-8)**: Cost out the AI stack (LLM calls per account, communication costs, infrastructure). Model break-even on different portfolio sizes and recovery rates.

5. **Technical POC (Week 4-12)**: Build the AI triage agent. Feed it sample patient accounts with different scenarios. Measure accuracy of categorization. Test outreach messaging with compliance review.

---

## SOURCES

- [Fortune Business Insights — RCM Market Size](https://www.fortunebusinessinsights.com/industry-reports/revenue-cycle-management-market-100275)
- [Towards Healthcare — U.S. Healthcare RCM Market](https://www.towardshealthcare.com/insights/us-healthcare-revenue-cycle-management-market-sizing)
- [CarePayment — Half of Hospital Bills Go Unpaid](https://www.carepayment.com/the-price-of-unpaid-medical-bills/)
- [Definitive Healthcare — Hospital Bad Debt Statistics](https://www.definitivehc.com/blog/hospital-bad-debt-statistics-you-need-to-know)
- [Mend — Bad Debt in Healthcare: Patient Payment Statistics](https://mend.com/resource/patient-payment-statistics-and-bad-debt-in-healthcare/)
- [Americollect — The Rise of Hospital Bad Debt](https://www.americollect.com/2025/06/the-rise-of-hospital-bad-debt/)
- [PayZen — How AI is Personalizing Healthcare Patient Financing](https://payzen.com/how-ai-is-personalizing-healthcare-payment-solutions/)
- [IntuitionLabs — Patient Payment Platforms: 2026 Review](https://intuitionlabs.ai/articles/patient-payment-platforms-review)
- [Crunchbase — PayZen Raises $15M](https://news.crunchbase.com/startups/medical-fintech-startup-payzen-ai-pay-later/)
- [CFPB — Medical Debt](https://www.consumerfinance.gov/rules-policy/medical-debt/)
- [Collections Authority — State Licensing Requirements](https://collectionsauthority.com/debt-collection-agency-licensing-requirements.html)
- [First Credit Online — Medical Debt Collection Laws 2026](https://www.firstcreditonline.com/blog/medical-debt-collection-laws-what-you-need-to-know/)
- [AHA — 3 Ways AI Can Improve Revenue Cycle Management](https://www.aha.org/aha-center-health-innovation-market-scan/2024-06-04-3-ways-ai-can-improve-revenue-cycle-management)
- [Menlo Ventures — 2025: The State of AI in Healthcare](https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/)
- [Yahoo Finance — U.S. Healthcare RCM Market Climbs to $195.92B by 2035](https://finance.yahoo.com/news/u-healthcare-rcm-market-climbs-140000893.html)
