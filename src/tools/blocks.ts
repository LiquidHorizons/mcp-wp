import { z } from 'zod';
import axios from 'axios';

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL!;
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME!;
const WORDPRESS_PASSWORD = process.env.WORDPRESS_PASSWORD!;

const auth = {
  username: WORDPRESS_USERNAME,
  password: WORDPRESS_PASSWORD,
};

export const blockTools = [
  {
    name: 'wp_insert_after_section',
    description:
      'Safely insert Gutenberg block markup after a named Liquid Horizons section marker without rewriting the whole page from ChatGPT.',
    schema: z.object({
      content_type: z.enum(['page', 'post']).default('page'),
      id: z.number(),
      after_marker: z.string(),
      new_marker: z.string(),
      block_markup: z.string(),
    }),
    handler: async ({
      content_type,
      id,
      after_marker,
      new_marker,
      block_markup,
    }: {
      content_type: 'page' | 'post';
      id: number;
      after_marker: string;
      new_marker: string;
      block_markup: string;
    }) => {
      const endpoint =
        content_type === 'page'
          ? `${WORDPRESS_API_URL}/wp-json/wp/v2/pages/${id}?context=edit`
          : `${WORDPRESS_API_URL}/wp-json/wp/v2/posts/${id}?context=edit`;

      const existing = await axios.get(endpoint, { auth });

      const rawContent =
        existing.data?.content?.raw ||
        existing.data?.content?.rendered ||
        '';

      const afterToken = `<!-- LH_SECTION_END: ${after_marker} -->`;

      if (!rawContent.includes(afterToken)) {
        throw new Error(`Marker not found: ${afterToken}`);
      }

      const newSection = `
<!-- LH_SECTION_START: ${new_marker} -->
${block_markup}
<!-- LH_SECTION_END: ${new_marker} -->
`;

      if (rawContent.includes(`<!-- LH_SECTION_START: ${new_marker} -->`)) {
        throw new Error(
          `Section already exists: ${new_marker}. Use replace_section instead.`
        );
      }

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
        success: true,
        id: updated.data.id,
        title: updated.data.title?.rendered,
        status: updated.data.status,
        inserted_after: after_marker,
        new_section: new_marker,
        edit_link: updated.data.link,
      };
    },
  },
];
