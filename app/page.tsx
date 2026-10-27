import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Experience from "./components/Experience";

export default async function HomePage() {
  // The original semantic portfolio copy is rendered on the server so it remains crawlable.
  const content = await readFile(join(process.cwd(), "content", "portfolio.html"), "utf8");
  return <Experience content={content} />;
}
