import { readFileSync } from "node:fs";
import { validateQuestions } from "../lib/rules.mjs";
validateQuestions(
  JSON.parse(
    readFileSync(new URL("../content/questions.json", import.meta.url), "utf8"),
  ),
);
console.log("12 preguntas válidas: OSI, dispositivos y topologías.");
