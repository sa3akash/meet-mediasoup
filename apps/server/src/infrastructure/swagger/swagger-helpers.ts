declare module "elysia" {
  interface DocumentDecoration {
    tags?: string[];
    summary?: string;
    description?: string;
    responses?: Record<string | number, any>;
    operationId?: string;
    deprecated?: boolean;
    [key: string]: any;
  }
}

export const SwaggerTags = {
  AUTH: "Authentication",
  USERS: "Users",
  MEETINGS: "Meetings",
  WEBRTC: "WebRTC",
  RECORDINGS: "Recordings",
  STREAMING: "Live Streaming",
  WHITEBOARD: "Whiteboard",
  FILES: "File Sharing",
  NOTIFICATIONS: "Notifications",
  CALENDAR: "Calendar",
  ANALYTICS: "Analytics",
  MODERATION: "Moderation",
  ADMIN: "Admin Console",
  SYSTEM: "System Health",
} as const;

export type SwaggerTag = (typeof SwaggerTags)[keyof typeof SwaggerTags];

export interface ApiDocOptions {
  tag: SwaggerTag;
  summary: string;
  description?: string;
  responses?: Record<number, { description: string }>;
}

/**
 * Creates standardized OpenAPI route details for Elysia endpoints.
 */
export function apiDoc(options: ApiDocOptions) {
  const defaultResponses = {
    200: { description: "Successful operation" },
    400: { description: "Bad request / validation failed" },
    401: { description: "Unauthorized / unauthenticated" },
    403: { description: "Forbidden / insufficient privileges" },
    404: { description: "Resource not found" },
    500: { description: "Internal server error" },
  };

  return {
    detail: {
      tags: [options.tag] as string[],
      summary: options.summary,
      description: options.description || options.summary,
      responses: {
        ...defaultResponses,
        ...(options.responses || {}),
      },
    },
  };
}


