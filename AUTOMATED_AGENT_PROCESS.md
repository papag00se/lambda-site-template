# Discovery phase
- If working with a current project:
	- Ask the agent to understand and document the current feature set supported in the code
	- Have the agent scan current issues/tickets to get an idea of feature requests and current bugs
- If creating a new project:
	- Give a fairly flushed out bullet point list of the feature set and notes/concerns you have thought of already
	- Ask AI to flush out the feature set from that description
- In either case, ask the AI to research similar products or competitors to build out a more complete feature set
- Output all feature set findings to a `*.md` file

# Guardrails
- Product Requirements Document (`/docs/product/*.md`)
	- Use multiple files \*.md format
	- Source the document from the above discovery phase
- Technical Specification Document (`/docs/spec/*.md`)
	- Use multiple files \*.md format
	- Have the AI assume security OWASP/PII/PCI pro, systems architect, and platform engineer roles
	- Inform the AI of any known tech aspects (chosen language, tech stack, infra, etc)
	- Ask it to build out the tech specs
- Tests: Unit, E2E, browser skill/playwright - definition of done is tests created and pass at 90%+ coverage
- Proper AGENTS.md (see examples)
	- Security, dev, platform roles
	- Keep tests and docs updated
	- Definition of done
- Scaffolding [OPTIONAL]: If you find yourself concerned with how the project is organized and operates then setup the minimal framework. In my example, I setup the lambda and local entry points, the default backend routes, a simple front-end, asset folders, a minimal deployment framework, and mobile builds.

# Create Tasks
- Ask the AI to review all docs and current code to create a phase-based priority list of the features to build. Give it your MVP required features if you want.

# The Unattended Tasks Loop
- The main prompt is saved in `./tasks/UNATTENDED_PROMPT.md` so it can be copy/pasted easily. It sets up the loop instructions
- Ask AI to prepopulate the `./tasks/TODO.md` and `./tasks/TASK_STATE.md` based on the directives in the `./tasks/UNATTENDED_PROMPT.md` and the phases/PRD documents - but don't actually run that prompt yet.
- Run the prompt after you have reviewed the task list. Ask it to limit by phase if you want, or just let 'er rip through everything.

# Infra and Deployment
- Ask the AI to create initial infra setup scripts. It will need at least read access to your environment. Or give it write access and let it set it all up.
- Ask AI to create a repeatable deployment script in your chosen CI (GitHub Actions, etc...)

# Human Tasks 
- Ask the AI to maintain a checklist of items that it needs you to do (credential/account setup, secrets creation, environment variable values, etc)
- Tell it to not include tasks it can do itself.

# Iterate
- Ask the agent something like:
  `Brainstorm. Analyze current feature set. Research competitors or similar projects. Find feature gaps. Think about possible related features, nice-to-haves, improvements, concerns and document them. Scan the full code base for gaps, document them. Update the unattended task list with any remaining gaps/features.`

IT WILL GET MANY THINGS WRONG. HAVE PATIENCE AND WORK WITH IT