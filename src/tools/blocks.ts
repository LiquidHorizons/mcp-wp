import { Tool } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const wpBaseUrl = process.env.WORDPRESS_API_URL;
const wpUsername = process.env.WORDPRESS_USERNAME;
const wpPassword = process.env.WORDPRESS_PASSWORD;

function getAuth() {
  if (!wpBaseUrl || !wpUsername || !wpPassword) {
    throw new Error('Missing WORDPRESS_API_URL, WORDPRESS_USERNAME, or WORDPRESS_PASSWORD');
  }

  return {
    username: wpUsername,
    password: wpPassword,
  };
}

const insertAfterSectionSchema = z.object({
  content_type: z.enum(['page', 'post']).default('page'),
  id: z.number(),
  after_marker: z.string(),
  new_marker: z.string(),
  block_markup: z.string(),
});

export const blockTools: Tool[] = [
  {
    name: 'wp_insert_after_section',
    description:
      'Safely insert Gutenberg block markup after a Liquid Horizons section marker without requiring ChatGPT to rewrite the whole page.',
    inputSchema: zodToJsonSchema(insertAfterSectionSchema) as Tool['inputSchema'],
  },
];

export const blockHandlers = {
  wp_insert_after_section: async (args: unknown) => {
    const parsed = insertAfterSectionSchema.parse(args);
    const auth = getAuth();

    const typePath = parsed.content_type === 'page' ? 'pages' : 'posts';

    const endpoint = `${wpBaseUrl}/wp-json/wp/v2/${typePath}/${parsed.id}?context=edit`;

    const existing = await axios.get(endpoint, { auth });

    const rawContent =
      existing.data?.content?.raw ||
      '';

    if (!rawContent) {
      throw new Error('Could not read raw page content. WordPress did not return content.raw.');
    }

    const afterToken = `<!-- LH_SECTION_END: ${parsed.after_marker} -->`;
    const newStartToken = `<!-- LH_SECTION_START: ${parsed.new_marker} -->`;
    const newEndToken = `<!-- LH_SECTION_END: ${parsed.new_marker} -->`;

    if (!rawContent.includes(afterToken)) {
      throw new Error(`Marker not found: ${afterToken}`);
    }

    if (rawContent.includes(newStartToken)) {
      throw new Error(`Section already exists: ${parsed.new_marker}`);
    }

    const newSection = `
${newStartToken}
${parsed.block_markup}
${newEndToken}
`;

    const updatedContent = rawContent.replace(
      afterToken,
      `${afterToken}\n\n${newSection}`
    );

    const updated = await axios.post(
      endpoint,
      {
        content: updatedContent,
        status: existing.data.status || 'draft',
      },
      { auth }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              id: updated.data.id,
              title: updated.data.title?.rendered,
              status: updated.data.status,
              inserted_after: parsed.after_marker,
              new_section: parsed.new_marker,
              link: updated.data.link,
              block_version: updated.data.content?.block_version,
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
