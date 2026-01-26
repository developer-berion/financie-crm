# Financie Group - Style Guide & Design System

This document serves as the **Single Source of Truth** for the visual design of the Financie CRM. All UI components must strictly adhere to these color tokens and guidelines.

## 🎨 Color Palette

We rely on a specific set of brand colors extracted from the official website. These are configured in `tailwind.config.js` and should be used via their utility classes.

### Primary Brand Colors

| Token Name | Hex Code | Tailwind Class | Usage Guidelines |
| :--- | :--- | :--- | :--- |
| **`brand-primary`** | `#19272B` | `bg-brand-primary` / `text-brand-primary` | **Main Identity Color.** Use for primary headings (H1, H2), main navigation bars, and key branding elements. |
| **`brand-secondary`** | `#414042` | `bg-brand-secondary` / `text-brand-secondary` | **Action Color.** Use for primary Call-to-Action (CTA) buttons (e.g., "Iniciar Sesión", "Guardar"). |
| **`brand-accent`** | `#F6C71E` | `bg-brand-accent` / `text-brand-accent` | **Highlight & Focus.** Use sparingly for emphasis, active states, or special "Gold" tier elements. |

### UI & Layout Colors

| Token Name | Hex Code | Tailwind Class | Usage Guidelines |
| :--- | :--- | :--- | :--- |
| **`brand-bg`** | `#F5F7FA` | `bg-brand-bg` | **Page Background.** The standard background color for all pages to ensure a clean, modern feel. |
| **`brand-text`** | `#20282D` | `text-brand-text` | **Body Text.** The default color for paragraphs and general content. High enough contrast for readability. |
| **`brand-border`** | `#E3E7EF` | `border-brand-border` | **Dividers & Strokes.** Use for card borders, input field outlines, and horizontal rules. |

---

## 🧩 Usage Examples

### Buttons
All primary actions should use the secondary brand color to match the "Get in Touch" style from the official site.

```tsx
// ✅ Correct Primary Button
<button className="bg-brand-secondary text-white hover:bg-brand-primary transition-colors">
  Action
</button>
```

### Headings
Major page titles should use the primary brand color.

```tsx
// ✅ Correct Heading
<h1 className="text-brand-primary text-3xl font-bold">
  Dashboard
</h1>
```

### Inputs
Forms should be clean with subtle borders.

```tsx
// ✅ Correct Input Field
<input className="border border-brand-border bg-white text-brand-text rounded-md" />
```
