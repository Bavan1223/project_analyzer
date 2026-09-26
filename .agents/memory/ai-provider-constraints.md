---
name: AI provider constraints
description: Provider model access and archive-review behavior learned while building the auditor.
---

The AI integration uses an OpenAI-compatible endpoint with a server-side key and a configurable model. A provider can list models that are still blocked by project policy, so model choice must remain configurable and should be checked against the account's exposed model list before changing defaults.

**Why:** The first available high-capability models were rejected by the provider even though the credential and endpoint were valid.

**How to apply:** When extending the reviewer, preserve `OPENAI_BASE_URL` and `OPENAI_MODEL` overrides and fail with a visible provider error rather than inventing a report when the model call fails.