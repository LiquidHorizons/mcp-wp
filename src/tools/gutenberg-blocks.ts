import { z } from "zod";

export const updateBlockTool = {
  name: "update_block_by_name",
  description: "Surgically replaces a specific Gutenberg block on a page or post by matching its custom advanced metadata.name string, keeping the rest of the page layout perfectly untouched.",
  inputSchema: z.object({
    post_id: z.number().description("The ID number of the page or post being modified"),
    metadata_name: z.string().description("The exact custom name assigned to the block's advanced metadata block name field (e.g., 'Hero Section')"),
    new_html: z.string().description("The raw Gutenberg HTML block layout string to insert into that position")
  }),
  execute: async (_context: any, args: { post_id: number; metadata_name: string; new_html: string }) => {
    // Grabbing the environment secrets directly to bypass internal framework routing
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
