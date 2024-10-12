import { execSync } from "child_process";

export default function setup() {
  try {
    execSync("pnpm seed", { stdio: "inherit" });
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
