# Description rubric

The `description` decides whether the skill loads. Write it as a matching rule,
not as a summary.

A good description:

- names the **kind of request** that should load the skill;
- names the **nearby requests that should not**, including the skill to use
  instead where one exists;
- is one or two sentences, plain language, no marketing;
- avoids words so broad ("code", "files", "help") that everything matches.

Test: read the description and ask, for three unrelated requests, "would this
match?" If yes for more than the intended one, tighten it.

Examples:

- Weak: `Helps with documents.`
- Better: `Create and fill DOCX/XLSX templates. Not for reading PDFs (use PDF).`
- Weak: `Improves your workflow.`
- Better: `Capture a repeated workflow as a reusable skill. Not for fixing an
  existing skill (use Skill Refiner).`
