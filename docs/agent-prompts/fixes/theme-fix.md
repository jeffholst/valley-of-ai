## Theme Implementation Requirements

### 1. **App Shell Integration**
- **Mandatory**: Include the shared app shell script in the HTML head:
  ```html
  <script src="/apps/shared/app-shell.js" defer></script>
  ```
- This provides automatic theme toggling, header injection, and consistent navigation.

### 2. **CSS Custom Properties (Variables)**
Define theme variables using CSS custom properties with the following structure:

```css
:root {
  /* Dark theme defaults */
  --bg: #0b1324;           /* Main background */
  --surface: #17233b;      /* Card/surface backgrounds */
  --surface-soft: #203251; /* Secondary surfaces */
  --text: #e6f4ea;         /* Primary text color */
  --text-dim: #97b3a1;     /* Muted/secondary text */
  --accent: #4ade80;       /* Primary accent color */
  --accent-2: #22c55e;     /* Secondary accent */
  --danger: #fb7185;       /* Error/danger color */
  --ring-bg: #2a3b5f;      /* Input ring backgrounds */
  --shadow: rgba(0, 0, 0, 0.35); /* Shadow color with alpha */
}

[data-theme="light"] {
  /* Light theme overrides */
  --bg: #f3faf6;
  --surface: #ffffff;
  --surface-soft: #ecf8ef;
  --text: #133022;
  --text-dim: #567162;
  --accent: #16a34a;
  --accent-2: #15803d;
  --danger: #e11d48;
  --ring-bg: #cde8d5;
  --shadow: rgba(22, 58, 37, 0.12);
}
```

### 3. **Variable Usage Guidelines**
- **Always use CSS variables** instead of hardcoded colors
- **Use semantic variable names** that describe purpose, not appearance
- **Leverage color-mix()** for transparency effects:
  ```css
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--muted) 24%, transparent);
  ```
- **Common variables to define** (extend as needed):
  - `--bg`, `--bg2` (background gradients)
  - `--surface`, `--surface-soft`
  - `--text`, `--muted`
  - `--accent`, `--accent-2`, `--danger`
  - `--shadow`

### 4. **HTML Structure Requirements**
- **Include required meta tags**:
  ```html
  <meta name="voa-main-site-url" content="__MAIN_SITE_URL__">
  <meta name="voa-main-site-name" content="__MAIN_SITE_NAME__">
  <meta name="voa-social-x-url" content="__SOCIAL_X_URL__">
  <meta name="voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__">
  <meta name="voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__">
  ```
- **Include Google Analytics** (if applicable):
  ```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=__GA_MEASUREMENT_ID__"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '__GA_MEASUREMENT_ID__');
  </script>
  ```

### 5. **Layout and Styling Standards**
- **Body styling**: Use grid centering with theme variables:
  ```css
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 16px;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    background: radial-gradient(1000px 700px at 20% 20%, var(--bg2), var(--bg));
    color: var(--text);
  }
  ```
- **Card styling**: Semi-transparent surfaces with borders:
  ```css
  .card {
    background: color-mix(in srgb, var(--surface) 90%, transparent);
    border: 1px solid color-mix(in srgb, var(--muted) 24%, transparent);
    border-radius: 18px;
    padding: 14px;
    box-shadow: 0 18px 45px var(--shadow);
  }
  ```
- **Button styling**: Gradient backgrounds with theme integration

### 6. **Theme Toggle Behavior**
- The app shell automatically injects a theme toggle button in the header
- Users can switch between light/dark modes
- Preference is saved in localStorage
- No manual theme toggle implementation needed in individual apps

### 7. **User theme preference**
The light/dark theme preference is stored in localStorage using the following mechanism:

## Storage Details

**Key**: `'theme'`  
**Values**: `'light'` or `'dark'`  
**Storage Method**: `localStorage.setItem('theme', themeValue)`

## Implementation Logic

#### 1. **Storage**: When a user toggles the theme, the preference is immediately saved:
   ```javascript
   localStorage.setItem('theme', 'light'); // or 'dark'
   ```

#### 2. **Retrieval Priority**: On page load, the theme is determined in this order:
   - First: Check existing `data-theme` attribute on `<html>` element
   - Second: Check localStorage for the `'theme'` key
   - Fallback: Default to `'light'` if neither exists

#### 3. **Persistence**: The preference persists across browser sessions and site visits, allowing users to maintain their chosen theme across all Valley of AI apps.

#### 4. **Synchronization**: The stored value is used to set the `data-theme` attribute on the document root, which triggers the CSS variable overrides for the appropriate theme.

This ensures a consistent, user-controlled theming experience across the entire Valley of AI application ecosystem.

### 8. **Accessibility and Performance**
- Ensure sufficient contrast ratios between `--text` and `--bg`
- Use semantic color variables that adapt appropriately
- Avoid hardcoded colors that don't respect theme changes
- Test both light and dark modes during development

### 9. **Validation Checklist**
Before submitting an app, verify:
- [ ] App shell script is included and loading
- [ ] All colors use CSS variables
- [ ] Light and dark themes look appropriate
- [ ] No hardcoded colors remain
- [ ] Theme toggle works correctly
- [ ] App integrates with the injected header/footer

This standard ensures all apps in the Valley of AI gallery have consistent theming, automatic dark/light mode support, and seamless integration with the shared navigation system.