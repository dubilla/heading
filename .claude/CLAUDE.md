# Heading Project Guidelines

Heading is a Next.js application with Anthropic SDK integration, NextAuth authentication, and Drizzle ORM.

## Error Handling

**Critical Convention:**

- **Internal services** (database queries, business logic, helper functions): Use `if/else` pattern
- **External services** (Anthropic API, third-party APIs, network calls): Use `try/catch` pattern

### Examples

```typescript
// Internal service - if/else pattern
function getUserById(id: string) {
  const user = db.query.users.findFirst({ where: eq(users.id, id) });

  if (!user) {
    return { error: "User not found" };
  }

  return { data: user };
}

// External service - try/catch pattern
async function callAnthropicAPI(prompt: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: prompt }],
    });
    return { data: response };
  } catch (error) {
    return { error: "Failed to call Anthropic API" };
  }
}
```

## Database Migrations

**NEVER run raw SQL directly to modify the schema.** Always use the migration workflow:

### Workflow:

1. **Generate migration**: Modify schema and run `npm run db:generate` to create migration files
2. **Test migration**: Run `npm run db:migrate` to apply the migration
3. **If issues arise**: Manually edit the generated SQL file, then re-run `npm run db:migrate`
4. **For rollback**: Delete the migration files and re-generate

### Commands:

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply pending migrations
- `npm run db:push` - Push schema directly (avoid this; use migrations instead)
- `npm run db:studio` - Open Drizzle Studio for database inspection

## Testing Strategy

### Principle

**Tests should guard against future change.** Write tests when:

- Future modifications are likely
- Those modifications could inadvertently break existing functionality
- The breakage wouldn't be immediately obvious

### Test Data Best Practices

- Never hardcode explicit IDs in tests - assume auto-increment IDs are non-sequential
- Tests should not rely on specific ID values (e.g., avoid `{ id: 1 }`)
- Use the ORM's delete methods for test cleanup rather than raw SQL
- This makes tests more robust and realistic to production behavior

### Testing Tools

- **Jest**: Test runner (run with `npm run test:run` for CI)
- **@testing-library/react**: Component testing

## Authentication

- Using NextAuth v5 (beta)
- Drizzle adapter for session management
- Follow NextAuth best practices for route protection

## Anthropic SDK Integration

- Store API keys in environment variables
- Use try/catch for all Anthropic API calls (external service)
- Handle rate limits and timeouts gracefully
- Log API errors for debugging

## Commit Standards

- Use `/commit` skill for organized, conventional commits
- Single-line commit messages only (no multi-line commits)
- No AI attribution in commits
- Each commit should represent working, tested code

## Development Workflow

### Before Committing

- ✅ All tests pass (`npm run test:run`)
- ✅ TypeScript compiles (`npm run typecheck`)
- ✅ Lint passes (`npm run lint`)
- ✅ Code formatted (`npm run format:check`)
- ✅ Database migrations tested and working

### Code Quality

- Husky hooks enforce quality standards
- Lint-staged runs on commit
- Follow project conventions from this file
