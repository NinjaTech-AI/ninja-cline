import { featureFlagsService } from "@/services/feature-flags"

interface ModelOption {
	value: string
	label: string
	description: string
	default?: boolean
}

const FALLBACK_DEFAULT_MODEL_ID = "zai:glm-4-6-cerebras"

let cachedDefaultModelId: string | null = null

/**
 * Get the default OpenAI compatible model ID from feature flags
 * This function caches the result to avoid repeated feature flag lookups
 */
export async function getOpenAiCompatibleDefaultModelId(): Promise<string> {
	// Return cached value if available
	if (cachedDefaultModelId) {
		return cachedDefaultModelId
	}

	try {
		const payload = await featureFlagsService.getPayload("model-settings")

		if (Array.isArray(payload)) {
			// Validate payload structure
			const isValid = payload.every(
				(option: any) =>
					typeof option.value === "string" &&
					typeof option.label === "string" &&
					typeof option.description === "string",
			)

			if (isValid) {
				const modelOptions = payload as ModelOption[]
				// Find the model marked as default
				const defaultOption = modelOptions.find((opt) => opt.default)
				const defaultModelId = defaultOption?.value || modelOptions[0]?.value || FALLBACK_DEFAULT_MODEL_ID

				// Cache the result
				cachedDefaultModelId = defaultModelId
				return defaultModelId
			}
		}
	} catch (error) {
		console.error("Error fetching default model from feature flag:", error)
	}

	// Fallback to hardcoded default
	cachedDefaultModelId = FALLBACK_DEFAULT_MODEL_ID
	return FALLBACK_DEFAULT_MODEL_ID
}

/**
 * Get the cached default model ID synchronously
 * Returns the cached value or fallback if not yet initialized
 */
export function getOpenAiCompatibleDefaultModelIdSync(): string {
	return cachedDefaultModelId || FALLBACK_DEFAULT_MODEL_ID
}

/**
 * Reset the cached default model ID
 * Useful for testing or when feature flags are updated
 */
export function resetOpenAiCompatibleDefaultModelId(): void {
	cachedDefaultModelId = null
}
