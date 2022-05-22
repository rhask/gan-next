import mailchannelsplugin from "@cloudflare/pages-plugin-mailchannels"

export const onRequest = mailchannelsplugin({
  personalizations: [
    {
      to: [{ name: "Brian", email: "bcar@ganintegrity.com" }],
    },
  ],
  from: { name: "GAN Bot", email: "concern@ganintegrity.com" },
  respondWith: () =>
    new Response(
      `Hey there, mail channel test successful.`
    ),
})
