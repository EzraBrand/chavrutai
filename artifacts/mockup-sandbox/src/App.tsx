import { mockupComponents } from "./.generated/mockup-components";

const IS_PREVIEW = /\/preview\//.test(window.location.pathname);

function PreviewRoute() {
  const path = window.location.pathname;
  const match = path.match(/\/preview\/(.+)/);
  if (!match) return <div>No match for: {path}</div>;

  const parts = match[1].split("/");
  const name = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join("/");

  const entry = mockupComponents.find(
    (c) => c.name === name && c.folder === folder
  );

  if (!entry) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif", color: "#555" }}>
        Not found: {folder}/{name}
        <br />
        Available: {mockupComponents.map(c => `${c.folder}/${c.name}`).join(", ")}
      </div>
    );
  }

  const C = entry.component as any;
  return <C />;
}

export default function App() {
  if (IS_PREVIEW) return <PreviewRoute />;
  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>Mockup Sandbox ({mockupComponents.length} components)</h1>
      <ul>
        {mockupComponents.map((c, i) => (
          <li key={i}>
            <a href={`/__mockup/preview/${c.folder}/${c.name}`}>
              {c.folder}/{c.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
