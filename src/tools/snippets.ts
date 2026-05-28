// src/tools/snippets.ts

export const snippetTools = [
  {
    name: "add_wp_code_snippet",
    description: "Creates and auto-activates a new PHP, CSS, or JS code snippet in WordPress via the Code Snippets bridge.",
    inputSchema: {
      type: "object",
      properties: {
        title: { 
          type: "string", 
          description: "The descriptive title for the snippet (e.g., 'Mobile Layout Fixes')" 
        },
        code: { 
          type: "string", 
          description: "The raw PHP, CSS, or JS code to execute." 
        },
        description: { 
          type: "string", 
          description: "An optional description explaining what this snippet does." 
        },
        scope: { 
          type: "string", 
          enum: ["global", "frontend", "admin"], 
          description: "Where the snippet should run. Defaults to global." 
        }
      },
      required: ["title", "code"]
    }
  }
];

export const snippetHandlers = {
  add_wp_code_snippet: async (argumentsJson: any) => {
    const { title, code, description, scope } = argumentsJson;

    // Pulling matching environment variable patterns from your existing config setup
    const wpApiUrl = process.env.WORDPRESS_API_URL;
    const username = process.env.WORDPRESS_USERNAME;
    const appPassword = process.env.WORDPRESS_APPLICATION_PASSWORD;

    if (!wpApiUrl || !username || !appPassword) {
      return {
        content: [{ type: "text", text: "Missing WordPress credentials in server environment variables." }],
        isError: true
      };
    }

    try {
      const response = await fetch(`${wpApiUrl}/wp-json/liquid-horizons/v1/snippets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`
        },
        body: JSON.stringify({ title, code, description, scope })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        return {
          content: [{ type: "text", text: `Failed to create snippet: ${errorData.message}` }],
          isError: true
        };
      }

      const data = await response.json();
      return {
        content: [{ type: "text", text: `Success! Snippet "${title}" created and auto-activated with ID: ${data.snippet_id}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error connecting to WordPress API: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
};
