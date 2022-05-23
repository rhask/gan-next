export const onRequestGet: PagesFunction = async ({ request, next, env }) => {
  return await fetch("https://plausible.io/js/plausible.js");
}
