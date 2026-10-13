AGENTS.md — Aklov Website

1. Project Identity

Aklov is a personal professional brand and business website focused on helping organizations improve their digital presence, sales processes, and business operations.

The services include:

- Website design and development.
- CRM and customer management systems.
- Business and sales process optimization.
- Workflow automation.
- Custom business applications.
- System integrations and reporting.

The website serves as both a professional portfolio and a business website for attracting prospective clients.

The intended audience includes business owners, founders, executives, operations managers, sales leaders, and organizations seeking practical solutions to business and technology challenges.

The website should communicate professionalism, credibility, technical competence, business understanding, and strong design judgment.

Aklov represents an individual professional brand. Do not use language such as "our team," "we," or "our experts" that implies a larger agency unless explicitly approved.

2. Content Ownership and Design Responsibility

The project owner and ChatGPT are responsible for developing, reviewing, and approving all website content.

Codex is responsible for designing and implementing the approved content within the existing website architecture.

Content ownership rules

- Use the approved copy supplied for each page.
- Do not independently rewrite, shorten, expand, or replace approved text.
- Do not invent project details, client outcomes, testimonials, statistics, credentials, or service claims.
- Do not generate new marketing copy unless explicitly requested.
- Preserve the meaning, tone, hierarchy, and intended emphasis of supplied content.
- Do not omit approved content merely to simplify the visual design.
- When content is missing, use clearly identified placeholders or report the missing information.
- Do not silently convert draft content into verified claims.
- If a content change would materially improve the design, propose it rather than implementing it without approval.

Minor typographic adjustments, line wrapping, and visual formatting are permitted as long as they do not alter the wording or meaning.

Design responsibility

Codex has creative ownership of the visual presentation and technical implementation.

This includes:

- Page composition and layout.
- Typography treatments.
- Spacing and alignment.
- Visual hierarchy.
- Responsive design.
- Section transitions.
- Appropriate animations and interactions.
- Component structure.
- Media presentation.
- Accessibility and performance.

Design decisions must accommodate approved content.

The project owner and ChatGPT determine what the website communicates.

Codex determines how that content is presented and implemented.

3. Technology and Development Environment

The website uses:

- Astro as its primary framework.
- GitHub for source control.
- Cloudflare for website hosting and deployment.

Before making changes, inspect the actual repository configuration.

Do not assume a particular Astro version, CSS framework, JavaScript framework, package manager, or deployment configuration without verifying it.

Follow the conventions already established in the repository.

Use the existing project structure, design tokens, shared components, and styling patterns wherever appropriate.

Avoid introducing new dependencies unless they provide a clear technical benefit.

4. Existing Website Design Identity

The Home and Solutions pages establish the initial visual identity of Aklov.

These pages are the primary reference for future design work.

The established direction includes:

- Premium editorial presentation.
- Confident typography.
- Strong visual hierarchy.
- Restrained use of color.
- Sophisticated spacing.
- Clean alignment.
- Purposeful transitions.
- A balance between professionalism and creative distinction.

Previously established visual references include:

- Charcoal: "#151515"
- Ivory: "#f5f2ea"
- Muted gold: "#d8bd78"
- Instrument Serif.
- DM Sans.

Treat these as established design references, not instructions to overwrite existing CSS variables or duplicate font declarations.

Inspect the current implementation and reuse its actual design tokens.

Do not introduce an unrelated visual identity on new pages.

5. Design Quality Standards

Every page should feel deliberately designed by an experienced website designer.

Pay particular attention to:

- Alignment and grid consistency.
- Spacing rhythm.
- Typography scale.
- Color harmony.
- Contrast and readability.
- Button hierarchy.
- Content density.
- Section transitions.
- Image composition.
- Responsive behavior.
- Overall visual coherence.

Avoid generic templates and predictable layouts that make the website feel automatically generated.

Do not use decorative elements merely to fill empty space.

Icon discipline

Use icons sparingly.

Functional icons are acceptable when they improve navigation or usability, such as search, menu, close, external link, and social media controls.

Avoid excessive:

- Feature icons.
- Decorative checkmarks.
- Floating circles.
- Unnecessary badges.
- Random SVG illustrations.
- Decorative symbols.
- Repeated icon-based feature grids.

Prefer typography, composition, imagery, and spacing to communicate hierarchy.

Motion and interaction

Use animation only when it improves clarity, interaction feedback, or visual quality.

Avoid excessive scroll effects, unnecessary parallax, distracting motion, and animations that delay access to content.

Respect reduced-motion preferences.

Interactive elements must behave consistently and predictably.

6. Creative Autonomy

Codex is encouraged to make strong, independent design decisions within the approved requirements.

Do not ask for approval on every minor design choice.

Explore layouts that suit the content and the purpose of each page.

Different pages may have distinct compositions while remaining part of the same visual system.

Do not force every page into the same card grid, hero structure, or section pattern.

However:

- Do not override approved content.
- Do not change established branding.
- Do not redesign unrelated pages.
- Do not introduce unrequested functionality.
- Do not make significant architectural changes without justification.
- Do not prioritize visual experimentation over usability.

When multiple valid design approaches exist, select the one that best balances aesthetics, usability, accessibility, performance, and maintainability.

7. Website Architecture

Follow Astro conventions and the existing repository structure.

Prefer:

- Reusable components.
- Structured content.
- Clear separation between content and presentation.
- Maintainable styling.
- Simple and predictable routing.
- Minimal client-side JavaScript.
- Consistent naming conventions.

Avoid:

- Large monolithic components.
- Duplicated layouts.
- Hard-coded content repeated across files.
- Unnecessary abstractions.
- Excessive dependencies.
- Unstructured inline styling.

Before introducing new components, check whether suitable components already exist.

Reuse existing components when practical without compromising design quality.

8. Portfolio / Work Page Architecture

The Work page is a central part of the website.

Its purpose is to demonstrate real implementation experience across websites, CRM systems, workflow automation, custom applications, and integrations.

Main route

Use one portfolio page:

"/work/"

Do not create separate portfolio pages for each service category unless explicitly requested.

Project filtering

Support the following categories:

1. All Projects.
2. Websites.
3. Customer & Sales Systems.
4. Workflow Automation.
5. Custom Business Applications.
6. Integrations & Reporting.

Projects may belong to multiple categories.

The Work page should support URL-based filtering so other pages can link directly to relevant categories.

Expected category parameters:

- "websites"
- "customer-systems"
- "automation"
- "applications"
- "integrations"

Unknown category values should fall back gracefully to All Projects.

Filtering should work without full-page reloads and support browser history navigation.

Project content structure

Use Astro content collections for portfolio projects.

Keep each project in its own content file.

Project data should support:

- Slug.
- Title.
- Short description.
- Project type.
- Primary category.
- Additional categories.
- Cover media.
- Media type.
- Optional external link.
- Display order or featured status.
- Full case-study content when provided.

Keep the schema extensible without overengineering it.

Project types

Distinguish between:

- Client Project.
- Independent Concept.
- Live Demo, where applicable.

A project type describes the nature of the work, while a category describes the service or capability demonstrated.

Do not present independent concepts as commissioned client projects.

Project details

The approved direction is to display full project details in a reusable popup opened from the Work page.

The future popup should support:

- Project overview.
- Business challenge.
- Requirements.
- Implementation details.
- Results or outcomes.
- Screenshots.
- GIFs or videos.
- Optional external links.

The popup must be responsive and accessible, with appropriate keyboard and dismissal behavior.

Do not create standalone project-detail routes unless explicitly requested.

Do not implement the popup before its assigned development phase.

9. Portfolio Media Management

Project media may be hosted externally using Cloudflare infrastructure.

The media system should support:

- Static screenshots.
- Animated GIFs.
- Short video demonstrations.
- Multiple media items per project.
- Optional captions.
- Different aspect ratios.
- Full-size inspection where appropriate.

Store media references in structured project data.

Do not hard-code image URLs into card layouts.

Use stable placeholders until approved media is supplied.

Do not use unrelated stock photography or generated images to represent actual client implementations.

Do not assume that a client's current live website still represents the work originally delivered.

External project links are optional and must be provided or approved.

Optimize media loading, layout stability, and responsive presentation.

For large animations, consider video-based playback when appropriate.

Do not expose private client records, credentials, or confidential screenshots.

10. Content Accuracy and Client Confidentiality

Accuracy takes priority over marketing exaggeration.

Do not invent:

- Business results.
- Conversion improvements.
- Revenue figures.
- Efficiency percentages.
- Customer testimonials.
- Project completion claims.
- Certifications.
- Client identities.
- Features that were not implemented.

Distinguish clearly between:

- Completed implementations.
- Partially completed implementations.
- Audits and assessments.
- Proposals and planning.
- Prototypes and demonstrations.
- Independent concepts.

Do not describe proposed functionality as completed work.

Do not publish sensitive client information.

If a project description contains uncertain claims, preserve the uncertainty or flag it for review.

Do not infer project results from screenshots alone.

11. Navigation and Cross-Page Consistency

Maintain consistency across:

- Header and navigation.
- Footer.
- Buttons and links.
- Typography.
- Colors.
- Responsive breakpoints.
- Interactive behavior.

Use shared components when appropriate.

Links from the Solutions page to portfolio categories should use the agreed Work page URL parameters.

Do not modify unrelated page content while implementing navigation changes.

Maintain correct internal routing and avoid broken links.

12. Accessibility and Responsive Design

Accessibility is a requirement, not an optional enhancement.

Use:

- Semantic HTML.
- Accessible navigation.
- Keyboard-operable controls.
- Visible focus states.
- Appropriate labels.
- Readable text contrast.
- Responsive layouts.
- Reduced-motion support.
- Correct image alternative text.
- Logical heading hierarchy.

Ensure that desktop, tablet, and mobile experiences are intentionally designed.

Do not treat mobile as a compressed desktop layout.

Avoid horizontal overflow, unusable controls, and excessive scrolling caused by poor layout decisions.

13. Performance and Technical Quality

Prioritize fast loading and efficient rendering.

- Use Astro's static rendering capabilities where appropriate.
- Avoid unnecessary client-side hydration.
- Minimize JavaScript.
- Avoid unnecessary third-party libraries.
- Lazy-load noncritical media.
- Prevent layout shifts.
- Use appropriate media dimensions.
- Keep animations lightweight.
- Maintain clean CSS and component boundaries.

Do not sacrifice usability or performance for visual effects.

14. Development Workflow

For every implementation task:

1. Inspect the relevant repository files.
2. Understand the existing design and architecture.
3. Identify reusable components and conventions.
4. Review the task-specific requirements.
5. Implement only the approved scope.
6. Run relevant validation and build commands.
7. Review the changes for regressions.
8. Report what was implemented and any unresolved issues.

When a task requires significant changes, use a separate branch or pull request where supported.

Avoid directly modifying the production branch for substantial development work.

Do not silently overwrite unrelated work.

Do not claim that a feature was tested unless the test was actually performed.

15. Scope and Change Control

Stay within the current task's approved scope.

Do not independently:

- Add new pages.
- Rewrite approved copy.
- Introduce additional services.
- Add unapproved portfolio projects.
- Redesign existing pages.
- Change hosting architecture.
- Introduce major dependencies.
- Implement features assigned to later phases.

If a necessary technical adjustment falls outside the scope, explain it before proceeding.

Minor implementation decisions that preserve the approved requirements may be made independently.

16. Development Phases

The website will be developed incrementally.

Work page — Phase 1

Build:

- Work page layout.
- Project cards.
- Category filters.
- URL-based filtering.
- Media placeholders.
- Responsive presentation.
- Initial Astro project content structure.

Do not implement full case studies or project-detail popups in this phase.

Work page — Phase 2

After Phase 1 approval:

- Populate complete project content files.
- Implement the reusable project popup.
- Integrate approved screenshots, GIFs, and other media.
- Add optional external project links.
- Test project interactions and responsiveness.

Do not begin Phase 2 without explicit approval.

Future pages and enhancements will have their own approved task briefs.

17. Source of Truth and Instruction Priority

Use this file as the repository's persistent development guidance.

Use the current approved Codex task brief for specific implementation requirements.

Use approved content files as the source of truth for website copy.

Use existing repository code as the source of truth for actual technical configuration.

When instructions conflict:

1. Follow higher-priority platform and safety instructions.
2. Follow the latest explicit project-owner decision.
3. Follow the approved task-specific requirements.
4. Apply this file's standing project guidance.
5. Preserve existing implementation conventions where they do not conflict with the above.

Do not silently resolve material contradictions by inventing requirements.

Flag significant conflicts or missing information.

18. Completion Reporting

At the end of each development task, provide:

- A concise summary of the completed work.
- The main files created or modified.
- Any important design or architectural decisions.
- Build and test results.
- Known limitations.
- Any information required from the project owner.
- Instructions for previewing the changes, where relevant.

Do not proceed to another development phase automatically.

The objective is to build a cohesive, credible, visually distinctive, and maintainable Aklov website while keeping content decisions under the project owner's control.
