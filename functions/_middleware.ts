import mailchannelsplugin from "@cloudflare/pages-plugin-mailchannels"

export const onRequest = mailchannelsplugin({
  personalizations: [
    {
      to: [{ name: "Brian", email: "bcar@ganintegrity.com" }],
    },
  ],
  from: { name: "Compliance Bot", email: "compliance@briancarbone.com" },
  respondWith: () =>
    new Response(null, { status: 302, headers: { Location: "/" } })
})
