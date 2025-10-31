import { EmptyRequest, StringRequest } from "@shared/proto/cline/common"
import open from "open"
import * as vscode from "vscode"
import { HostProvider } from "@/hosts/host-provider"

/**
 * Writes text to the system clipboard
 * @param text The text to write to the clipboard
 * @returns Promise that resolves when the operation is complete
 * @throws Error if the operation fails
 */
export async function writeTextToClipboard(text: string): Promise<void> {
	try {
		await HostProvider.env.clipboardWriteText(StringRequest.create({ value: text }))
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to write to clipboard: ${errorMessage}`)
	}
}

/**
 * Reads text from the system clipboard
 * @returns Promise that resolves to the clipboard text
 * @throws Error if the operation fails
 */
export async function readTextFromClipboard(): Promise<string> {
	try {
		const response = await HostProvider.env.clipboardReadText(EmptyRequest.create({}))
		return response.value
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		throw new Error(`Failed to read from clipboard: ${errorMessage}`)
	}
}

/**
 * Opens an external URL in the default browser
 * @param url The URL to open
 * @returns Promise that resolves when the operation is complete
 * @throws Error if the operation fails
 */
export async function openExternal(url: string): Promise<void> {
	console.log("Opening browser:", url)
	await open(url)
}
/**
 * Environment variable utilities for Ninja API configuration
 *
 * These environment variables take precedence over stored configuration values,
 * allowing for centralized configuration management in CI/CD, containerized
 * deployments, or organization-wide settings.
 */

/**
 * Transform Ninja API Base URL to convert production domain to public domain
 * Converts api.prod.myninja.ai to api.myninja.ai
 * @param url The URL to transform
 * @returns The transformed URL or undefined if input is undefined
 */
export function transformNinjaApiBaseUrl(url: string | undefined): string | undefined {
	if (!url) {
		return url
	}
	return url.replace(/api\.prod\.myninja\.ai/g, "api.myninja.ai")
}

/**
 * Get Ninja API Base URL from environment variable
 * @returns The base URL if NINJA_API_BASE_URL is set, undefined otherwise
 */
export function getNinjaApiBaseUrl(): string | undefined {
	const baseUrl = process.env.NINJA_API_BASE_URL || vscode.workspace.getConfiguration("ninja-dev").get<string>("baseUrl")
	return transformNinjaApiBaseUrl(baseUrl)
}

/**
 * Get Ninja API Key from environment variable
 * @returns The API key if NINJA_API_KEY is set, undefined otherwise
 */
export function getNinjaApiKey(): string | undefined {
	return process.env.NINJA_API_KEY || vscode.workspace.getConfiguration("ninja-dev").get<string>("apiKey")
}
