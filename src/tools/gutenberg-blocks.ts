import { z } from "zod";

export const updateBlockTool = {
  name: "update_block_by_name",
  description: "Surgically replaces a specific Gutenberg block on a page or post by matching its custom advanced metadata.name string, keeping the rest of the page layout perfectly untouched.",
  inputSchema: z.object({
    post_id: z.number().description("The ID number of the page or post being modified"),
    metadata_name: z.string().description("The exact custom name assigned to the block's advanced metadata block name field (e.g., 'Hero Section')"),
    new_html: z.string().description("The raw Gutenberg HTML block layout string to insert into that position")
  }),
  execute: async (context: any, args: { post_id: number; metadata_name: string; new_html: string }) => {
    // This uses your framework's universal axios/fetch request broker bypassing the strict type checks
    const response = await context.wp.post("/wp-json/mcp/v1/update-block", args);
    return {
      content: [{ type: "text", text: JSON.stringify(response.data || response) }]
    };
  }
};
