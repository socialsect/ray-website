import next from "eslint-config-next";

const config = [
  { ignores: [".next/**", "node_modules/**", ".taste-skill/**", ".impeccable/**", "next-env.d.ts", "index.html"] },
  ...next,
];

export default config;
