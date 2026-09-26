// Inline, blocking script that sets data-theme on <html> before first paint,
// so switching pages (or reloading) never flashes the wrong theme. Reads a
// purely local preference from localStorage — no account/profile data, no
// backend call, nothing that touches lib/** or Supabase.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("aura-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
