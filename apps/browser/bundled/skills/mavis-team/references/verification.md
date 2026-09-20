# Verification

Loaded when a Mavis Team task involves code changes. Provides code-specific
verification strategy. It has no daemon or CLI dependencies.

## Code preflight

- **Read key files** — understand structure at a high level, not every line.
- **Identify the change boundary** — files, interfaces, and downstream callers
  at risk.
- **Verify scope** — if it fits one file under ~200 lines, do it yourself.
- **Note constraints** — exact paths, naming conventions, and invariants to bake
  into worker prompts.

If two or more implementation tasks depend on the same API contract, schema, or
migration strategy, write a short shared design note and have them reference it.

Do not split codebase exploration from implementation: a worker can read the
code itself.

## Task splitting for code

Split only when deliverables are genuinely independent (for example data layer
vs API vs UI in different packages). Otherwise keep it as one task.

For code-producing plans, tests are a real deliverable boundary. By default:

1. **Implementation task** — product/source change plus the obvious colocated
   tests.
2. **Test-coverage task** — adds/updates unit, integration, and end-to-end
   coverage and manual-test evidence; depends on the implementation.
3. **Verifier pass(es)** — read-only, adversarial verification.

If a verifier finds a coverage gap, it reports the gap; the producer fixes it.
Verifiers never edit project files (they may use temporary scripts).

## Code-specific verification

Verifiers must:

- **Run the code** — build, test, lint. Never review a diff by reading alone.
- **Check behavior** — confirm the change does what it claims, not just that it
  compiles.
- **Test edge cases** — empty inputs, concurrency, error paths, boundaries.
- **Review design** — naming, abstraction boundaries, consistency.
- **Security check** — no exposed secrets, no new injection vectors, auth
  enforced.
- **Check migrations** — reversibility, data preservation, compatibility.

Verifiers must not:

- Rubber-stamp by re-reading the producer's description.
- Check only formatting or style.
- Skip running tests because "the code looks right".
- Add or modify project tests.

A FAIL for missing coverage must name the precise gap (unit, integration, e2e,
manual) so the next pass can close it.

## Patterns

- **Implementation + test coverage + read-only verification** — default for code.
- **Implementation with review and test verifiers** — for migrations, agent/
  skill behavior, API/CLI behavior, persisted data, or permissions.
- **Parallel component tracks + one integration gate** — only when tracks live
  in different packages; the gate depends on all of them and re-derives
  end-to-end behavior.
- **Migration + compatibility verifier** — verify backward compatibility, data
  integrity, rollback safety.
- **Security-sensitive change + adversarial review** — actively try to break the
  boundary.
- **Broad mechanical sweep** — split by package/module to avoid conflicts, then
  verify no spots were missed.

## Anti-pattern

Do not over-shard one coder's task. If you can hold the full diff in your head,
it is one task. Chaining `schema → repo → tests` as three tasks pays three
cold-start and verification costs for no parallelism.
