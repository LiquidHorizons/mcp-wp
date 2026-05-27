import { z } from "zod";

export const updateBlockTool = {
  name: "update_block_by_name",
  description: "Surgically replaces a specific Gutenberg block on a page or post by matching its custom advanced metadata.name string, keeping the rest of the page layout perfectly untouched.",
  inputSchema: z.object({
    post_id: z.number(),
    metadata_name: z.string(),
    new_html: z.string()
  }),
  execute: async (args: { post_id: number; metadata_name: string; new_html: string }) => {
    const wpUrl = process.env.WORDPRESS_URL || "";
    const username = process.env.WORDPRESS_USERNAME || "";
    const password = process.env.WORDPRESS_PASSWORD || "";
    
    const targetUrl = `${wpUrl.replace(/\/$/, "")}/wp-json/mcp/v1/update-block`;
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify(args)
    });

    const data = await response.json();

    return {
      content: [{ type: "text", text: JSON.stringify(data) }]
    };
  }
};
