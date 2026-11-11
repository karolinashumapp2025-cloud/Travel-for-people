// Збирає папку публікації dist/ лише з файлів, потрібних сайту.
// Звітні скриншоти (screenshots/) та службові файли на сайт не потрапляють.
// Вихідні файли не змінюються — тільки копіюються.
import { cpSync, rmSync } from "node:fs";

const OUT_DIR = "dist";
const SITE_FILES = ["index.html", "css", "assets"];

rmSync(OUT_DIR, { recursive: true, force: true });
for (const file of SITE_FILES) {
  cpSync(file, `${OUT_DIR}/${file}`, { recursive: true });
}

console.log(`Built ${OUT_DIR}/: ${SITE_FILES.join(", ")}`);
