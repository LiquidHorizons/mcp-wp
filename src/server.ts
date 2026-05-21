#!/usr/bin/env node
// src/server.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { allTools, toolHandlers } from './tools/index.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'wordpress',
  version: '0.0.1',
});

function jsonSchemaPropertyToZod(prop: any): z.ZodTypeAny {
  if (!prop || typeof prop !== 'object') {
    return z.any();
  }

  let schema: z.ZodTypeAny;

  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    schema = z.enum(prop.enum as [string, ...string[]]);
  } else {
    switch (prop.type) {
      case 'string':
        schema = z.string();
        break;
      case 'number':
      case 'integer':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'array':
        schema = z.array(z.any());
        break;
      case 'object':
        schema = z.record(z.any());
        break;
      default:
        schema = z.any();
    }
  }

  if (prop.description && typeof schema.describe === 'function') {
    schema = schema.describe(prop.description);
  }

  if (prop.default !== undefined) {
    schema = schema.default(prop.default);
  }

  return schema;
}

function getToolShape(inputSchema: any): z.ZodRawShape {
  if (inputSchema?.shape) {
    return inputSchema.shape;
  }

  if (inputSchema?.properties) {
    const required = new Set(inputSchema.required || []);
    const shape: z.ZodRawShape = {};

    for (const [key, prop] of Object.entries(inputSchema.properties)) {
      let fieldSchema = jsonSchemaPropertyToZod(prop);

      if (!required.has(key)) {
        fieldSchema = fieldSchema.optional();
      }

      shape[key] = fieldSchema;
    }

    return shape;
  }

  return {};
}

for (const tool of allTools) {
  const handler = toolHandlers[tool.name as keyof typeof toolHandlers];

  if (!handler) {
    continue;
  }

  const toolShape = getToolShape((tool as any).inputSchema);

  (server as any).tool(
    tool.name,
    tool.description || '',
    toolShape,
    async (args: any) => {
      const result = await handler(args);

      return result.toolResult || result;
    }
  );
}

async function main() {
  const { logToFile } = await import('./wordpress.js');

  logToFile('Starting WordPress MCP server...', 'info');
  logToFile(`Node version: ${process.version}`, 'info');
  logToFile(`Working directory: ${process.cwd()}`, 'info');

  try {
    logToFile('Initializing WordPress client...');
    const { initWordPress } = await import('./wordpress.js');
    await initWordPress();
    logToFile('WordPress client initialized successfully.');

    logToFile('Setting up server transport...');

    if (process.env.PORT) {
      const express = await import('express');
      const app = express.default();

      const transports: Record<string, any> = {};

      app.get('/sse', async (req, res) => {
        const transport = new SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;

        res.on('close', () => {
          delete transports[transport.sessionId];
        });

        await server.connect(transport);
      });

      app.post('/messages', async (req, res) => {
        const sessionId = req.query.sessionId as string;
        const transport = transports[sessionId];

        if (!transport) {
          res.status(400).send('No transport found for sessionId');
          return;
        }

        await transport.handlePostMessage(req, res);
      });

      app.get('/', (req, res) => {
        res.json({ status: 'online', endpoint: '/sse' });
      });

      const port = Number(process.env.PORT || 10000);

      app.listen(port, () => {
        logToFile(`MCP SSE server listening on port ${port}`);
      });
    } else {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      logToFile('WordPress MCP Server running on stdio');
    }

    logToFile(`Registered ${allTools.length} tools`);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logToFile(`Failed to initialize server: ${errorMessage}`);

    if (errorStack) {
      logToFile(`Stack trace: ${errorStack}`);
    }

    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  process.stderr.write('[SHUTDOWN] Received SIGTERM, shutting down...\n');
  process.exit(0);
});

process.on('SIGINT', () => {
  process.stderr.write('[SHUTDOWN] Received SIGINT, shutting down...\n');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  process.stderr.write(`[FATAL] Uncaught exception: ${error}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  process.stderr.write(`[FATAL] Unhandled rejection: ${error}\n`);
  process.exit(1);
});

main().catch((error) => {
  process.stderr.write(`[FATAL] Startup error: ${error}\n`);
  process.exit(1);
});
