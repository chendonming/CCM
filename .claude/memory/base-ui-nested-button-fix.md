---
name: base-ui-nested-button-fix
description: @base-ui/react TooltipTrigger renders a <button> by default - use the `render` prop to compose with Button component instead of nesting
metadata:
  type: project
---

When using `@base-ui/react` TooltipTrigger together with shadcn/ui Button component, TooltipTrigger renders a `<button>` by default, and wrapping a `<Button>` inside it creates nested `<button>` elements which is invalid HTML and causes hydration errors.

**Fix:** Use the `render` prop on `TooltipTrigger` to render it directly as the Button component:

```tsx
// ❌ Wrong - creates nested <button> elements
<TooltipTrigger>
  <Button variant="ghost" size="icon" onClick={handler}>...</Button>
</TooltipTrigger>

// ✅ Correct - TooltipTrigger renders as Button via render prop
<TooltipTrigger render={<Button variant="ghost" size="icon" />} onClick={handler}>
  ...
</TooltipTrigger>
```

This applies to all `@base-ui/react` trigger/popover components that render `<button>` by default, not just TooltipTrigger.

**Why:** base-ui has no `asChild` prop like Radix UI. Instead it uses a polymorphic `render` prop to let the consumer control the host element.
