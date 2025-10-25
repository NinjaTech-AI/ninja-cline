import type { LogMessageRequest } from "@shared/proto/cline/common"
import { Empty, LogLevel } from "@shared/proto/cline/common"
import { Logger } from "@/services/logging/Logger"
import type { Controller } from "../index"

/**
 * Logs a message from the webview to the extension output channel
 * @param controller The controller instance
 * @param request The log message request with level, message, and optional error stack
 * @returns Empty response
 */
export async function logMessage(_controller: Controller, request: LogMessageRequest): Promise<Empty> {
	const message = `[Webview] ${request.message}`

	switch (request.level) {
		case LogLevel.LOG_DEBUG:
			Logger.debug(message)
			break
		case LogLevel.LOG_INFO:
			Logger.info(message)
			break
		case LogLevel.LOG_WARN:
			Logger.warn(message)
			break
		case LogLevel.LOG_ERROR:
			Logger.error(message, request.errorStack ? new Error(request.errorStack) : undefined)
			break
		default:
			Logger.log(message)
	}

	return Empty.create({})
}
