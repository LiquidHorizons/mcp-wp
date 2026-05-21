import axios from 'axios';
import { z } from 'zod';

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

export const blockTools = [
  {
    name: 'wp_insert_after_section',
    description:
      'Safely insert Gutenberg block markup after a Liquid Horizons section marker without requiring ChatGPT to rewrite the whole page.',
    inputSchema: {
      content_type: z.enum(['page', 'post']).default('page').describe('Whether to edit a page or post.'),
      id: z.number().describe('The WordPress page or post ID.'),
      after_marker: z.string().describe('The existing section marker to insert after, for example cta-band.'),
      new_marker: z.string().describe('The new section marker name, for example footer.'),
      block_markup: z.string().describe('Raw Gutenberg block markup to insert.'),
    },
  },
];

export const blockHandlers = {
  wp_insert_after_section: async (args: any) => {
    const contentType = args.content_type || 'page';
    const id = Number(args.id);
    const afterMarker = String(args.after_marker || '');
    const newMarker = String(args.new_marker || '');
    const blockMarkup = String(args.block_markup || '');

    if (!id) {
      throw new Error('Missing required field: id');
    }

    if (!afterMarker) {
      throw new Error('Missing required field: after_marker');
    }

    if (!newMarker) {
      throw new Error('Missing required field: new_marker');
    }

    if (!blockMarkup) {
      throw new Error('Missing required field: block_markup');
    }

    const auth = getAuth();
    const typePath = contentType === 'post' ? 'posts' : 'pages';
    const endpoint = `${wpBaseUrl}/wp-json/wp/v2/${typePath}/${id}?context=edit`;

    const existing = await axios.get(endpoint, { auth });

    const rawContent = existing.data?.content?.raw || '';

    if (!rawContent) {
      throw new Error('Could not read raw page content. WordPress did not return content.raw.');
    }

    const afterToken = `<!-- LH_SECTION_END: ${afterMarker} -->`;
    const newStartToken = `<!-- LH_SECTION_START: ${newMarker} -->`;
    const newEndToken = `<!-- LH_SECTION_END: ${newMarker} -->`;

    if (!rawContent.includes(afterToken)) {
      throw new Error(`Marker not found: ${afterToken}`);
    }

    if (rawContent.includes(newStartToken)) {
      throw new Error(`Section already exists: ${newMarker}`);
    }

    const newSection = `
${newStartToken}
${blockMarkup}
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
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              id: updated.data.id,
              title: updated.data.title?.rendered,
              status: updated.data.status,
              inserted_after: afterMarker,
              new_section: newMarker,
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
