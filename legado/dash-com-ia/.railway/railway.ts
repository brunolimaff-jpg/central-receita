import { defineRailway, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "chatbot";

export default defineRailway(() => {
  const chatbot = service("chatbot", {
    start: "mkdir -p /data && { [ -f /data/custom.db ] || cp db/custom.db /data/custom.db; } && NODE_ENV=production node .next/standalone/server.js",
    healthcheck: "/",
    healthcheckTimeout: 120,
    // builder from CaC: "NIXPACKS"
  });
  return project("fantastic-alignment", {
    resources: [chatbot],
  });
});
