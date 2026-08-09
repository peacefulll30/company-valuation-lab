import type { InferUITools, UIDataTypes, UIMessage } from "ai";
import type { AnalystTools } from "./tools";

/** Shared client/server typing for the Analyst chat's single tool (no runtime import of the route). */
export type AnalystChatTools = InferUITools<AnalystTools>;
export type AnalystUIMessage = UIMessage<never, UIDataTypes, AnalystChatTools>;
