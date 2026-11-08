# Post-development readiness register

This register separates launch operations and owner decisions from Development MVP acceptance. Entries require separate authorization for production staging or live sales.

| Gate | Item | Minimum closure |
| --- | --- | --- |
| Before staging | Production environment and rollback | Identify the separate database, Blob storage, origins, OAuth client, Resend sender and credential scopes. Rehearse migrations and restore on a disposable target. Assign a rollback operator and verify course checkout is disabled in the UI and API. |
| Before staging | Production security | Decide which Preview authentication headers apply in Production. Verify administrator access, credential handling and redaction, and isolation of test and production data. |
| Before live sales | Payment and refund emails, receipts and invoices | Choose who sends each communication. Confirm merchant details and Stripe receipt settings. Verify receipt and refund delivery. Decide whether itemized invoices are required. The app does not currently send course payment or refund emails. |
| Before live sales | Support contact and privacy requests | Approve a monitored customer inbox, an operator, and a procedure for identity verification, order lookup, privacy requests and retention. The current checkout support link goes to the coaching intake form. |
| Before live sales | Refunds, disputes and delayed payment operations | Approve a refund policy, response templates and operator coverage. Rehearse refund and dispute communications, Stripe webhook recovery, alert delivery, and revoked learner access. Verify the configured reconciliation cadence against expected volume. |
| Before live sales | Merchant identity, terms, tax and withdrawal | Confirm contracting entity, address, target markets, disclosures, applicable tax and invoice requirements, refund and withdrawal rules, and any consent needed before providing immediate course access. Obtain qualified review. |
| Before live sales | Media and downloadable material | Verify Vimeo embedding restrictions on approved and unrelated domains. Review the final course inventory for captions and accessible, tagged PDFs or accessible equivalents. |
| Before live sales | Commerce configuration | Verify the live Stripe account and prices, signed webhook, return origin, reconciliation secret, alert inbox, and the Tunisia restriction from appropriate locations. Preserve the training payment flow. |
| Separate activation | Public SEO and analytics | Approve course indexing explicitly. Capture and review actual provider requests with synthetic data, then verify provider settings before enabling production analytics. |
