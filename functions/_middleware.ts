import mailchannelsplugin from "@cloudflare/pages-plugin-mailchannels"

export const onRequest = mailchannelsplugin({
  personalizations: [
    {
      to: [{ name: "Brian Carbone", email: "bcar@ganintegrity.com" }],
    },
  ],
  from: { name: "Nerve Bot", email: "hello@briancarbone.com" },
  respondWith: () => new Response(null, { status: 302, headers: { Location: "/" } })
})
