# Contributing Guidelines & Developer Standards 🤝

Thank you for contributing to the **Mochi AI Companion** project! To ensure code quality, consistency, and a seamless review process, please adhere to the following standards.

---

## 1. Code Style Conventions

### 1.1 TypeScript & React
- Enforce strict type checking (`"strict": true` in `tsconfig.json`).
- Avoid `any` types; define explicit interfaces or types for all component props, custom hook returns, and service responses.
- Use functional React components with standard hook patterns.
- Keep components small and single-purpose (< 200 lines per file).

### 1.2 CSS & Design Tokens
- Use Vanilla CSS Modules (`Component.module.css`) or standard global custom properties (`src/styles/tokens.css`).
- Never hardcode arbitrary hex colors; use defined color tokens (e.g., `var(--color-bg-primary)`).
- Ensure high contrast ratios for glassmorphism UI elements to maintain accessibility.

---

## 2. Git Branch Naming & Commit Formatting

### 2.1 Branch Naming Conventions
Structure branch names with a category prefix and brief description:
- `feature/3d-lip-sync-morphs`
- `fix/webcam-permission-leak`
- `docs/update-api-spec`
- `refactor/emotion-store-slice`

### 2.2 Conventional Commits Format
We enforce the **Conventional Commits** specification for all commit messages:

```
<type>(<scope>): <short summary>

[optional body]
```

#### Allowed Types:
- `feat`: A new feature for the user or companion interface.
- `fix`: A bug fix in code, 3D rendering, or API calls.
- `docs`: Documentation changes only.
- `style`: Formatting, missing semi-colons, white-space changes.
- `refactor`: Code restructuring without changing external behavior.
- `test`: Adding or updating unit/E2E test suites.
- `chore`: Updating build scripts, dependencies, or configuration.

#### Examples:
```bash
git commit -m "feat(character): add eye blink procedural animation loop"
git commit -m "fix(api): retry on claude API rate limit 429 errors"
```

---

## 3. Pull Request (PR) Workflow

1. **Fork & Branch**: Create your feature branch from `main`.
2. **Implement & Test**: Write your code and ensure unit/integration tests pass locally.
3. **Commit Cleanly**: Follow conventional commit guidelines.
4. **Open Pull Request**: Fill out the PR template with:
   - Summary of changes.
   - Related issue numbers.
   - Screenshots/videos for UI or 3D character modifications.
5. **Code Review**: Address feedback from core maintainers.

---

## 4. Testing Requirements

- **Unit & Integration Tests**: All new custom hooks (`src/hooks/`) and utility functions (`src/utils/`) require Vitest tests with > 80% coverage.
- **Component Tests**: Verify React components render without throwing errors and interact properly with state stores.
- **E2E Tests**: Critical paths (e.g., sending a chat message, changing companion voice settings) must pass Playwright E2E verification.

```bash
# Run tests before submitting PR
npm run test
npm run test:e2e
```

---

## 5. PR Reviewer Checklist

Before merging any PR, reviewers ensure:
- [ ] Code compiles with zero TypeScript errors.
- [ ] All unit and E2E tests pass cleanly.
- [ ] No hardcoded API keys or secret tokens are present.
- [ ] 3D graphics performance remains smooth (60 FPS maintained).
- [ ] New functionality is documented in the corresponding `docs/` files.

---

## 🔗 Related Documentation
- 📖 [Project README Overview](README.md)
- 🏗️ [Architecture Overview](ARCHITECTURE.md)
- ⚙️ [Developer Setup Guide](SETUP.md)
