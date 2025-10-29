import { azureOpenAiDefaultApiVersion } from "@shared/api"
import { FeatureFlagRequest } from "@shared/proto/cline/feature_flags"
import { Mode } from "@shared/storage/types"
import { VSCodeButton, VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { FeatureFlagsServiceClient } from "@/services/grpc-client"
import { getAsVar, VSC_DESCRIPTION_FOREGROUND } from "@/utils/vscStyles"
import { ApiKeyField } from "../common/ApiKeyField"
import { BaseUrlField } from "../common/BaseUrlField"
import { DebouncedTextField } from "../common/DebouncedTextField"
import { ModelInfoView } from "../common/ModelInfoView"
import { normalizeApiConfiguration } from "../utils/providerUtils"
import { useApiConfigurationHandlers } from "../utils/useApiConfigurationHandlers"

/**
 * Props for the OpenAICompatibleProvider component
 */
interface OpenAICompatibleProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

/**
 * Model option structure from PostHog feature flag
 */
interface ModelOption {
	value: string
	label: string
	description: string
	default?: boolean
}

/**
 * Fallback model options for Ninja API (used when feature flag is not available)
 */
const FALLBACK_MODEL_OPTIONS: ModelOption[] = [
	{
		value: "zai:glm-4-6",
		label: "Standard",
		description: "Balanced for quality & speed. Powered by GLM-4.6, 357B Parameters",
		default: false,
	},
	{
		value: "zai:glm-4-6-cerebras",
		label: "Fast",
		description: "Fastest agentic coder in the world. Powered by GLM 4.6 Cerebras",
		default: true,
	},
	{
		value: "anthropic:claude-sonnet-4-5-bedrock",
		label: "Complex",
		description: "Highest quality LLM for complex tasks. Powered by Sonnet 4.5",
		default: false,
	},
]

/**
 * The OpenAI Compatible provider configuration component
 */
export const OpenAICompatibleProvider = ({ showModelOptions, isPopup, currentMode }: OpenAICompatibleProviderProps) => {
	const { apiConfiguration } = useExtensionState()
	const { handleFieldChange } = useApiConfigurationHandlers()

	// Get the normalized configuration
	const { selectedModelId, selectedModelInfo } = normalizeApiConfiguration(apiConfiguration, currentMode)

	// Fetch model options from feature flag service
	const [modelOptionsPayload, setModelOptionsPayload] = useState<any>(null)

	useEffect(() => {
		const fetchModelOptions = async () => {
			try {
				const response = await FeatureFlagsServiceClient.getFeatureFlagPayload(
					FeatureFlagRequest.create({
						flagName: "model-settings",
					}),
				)
				if (response.payloadJson) {
					const payload = JSON.parse(response.payloadJson)
					setModelOptionsPayload(payload)
				}
			} catch (error) {
				console.error("Error fetching model options from feature flag:", error)
			}
		}
		fetchModelOptions()
	}, [])

	// Parse and validate model options from feature flag
	const MODEL_OPTIONS = useMemo<ModelOption[]>(() => {
		if (Array.isArray(modelOptionsPayload)) {
			// Validate that payload has the correct structure
			const isValid = modelOptionsPayload.every(
				(option: any) =>
					typeof option.value === "string" &&
					typeof option.label === "string" &&
					typeof option.description === "string",
			)
			if (isValid) {
				return modelOptionsPayload as ModelOption[]
			}
		}
		// Fallback to static options if feature flag is not available or invalid
		return FALLBACK_MODEL_OPTIONS
	}, [modelOptionsPayload])

	// Find default model from options or use first one
	const DEFAULT_MODEL = useMemo(() => {
		const defaultOption = MODEL_OPTIONS.find((opt) => opt.default)
		return defaultOption?.value || MODEL_OPTIONS[0]?.value || "zai:glm-4-6"
	}, [MODEL_OPTIONS])

	// Debounced function to refresh OpenAI models (prevents excessive API calls while typing)
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [])

	// const debouncedRefreshOpenAiModels = useCallback((baseUrl?: string, apiKey?: string) => {
	// 	if (debounceTimerRef.current) {
	// 		clearTimeout(debounceTimerRef.current)
	// 	}

	// 	if (baseUrl && apiKey) {
	// 		debounceTimerRef.current = setTimeout(() => {
	// 			ModelsServiceClient.refreshOpenAiModels(
	// 				OpenAiModelsRequest.create({
	// 					baseUrl,
	// 					apiKey,
	// 				}),
	// 			).catch((error) => {
	// 				console.error("Failed to refresh OpenAI models:", error)
	// 			})
	// 		}, 500)
	// 	}
	// }, [])

	// Set locked values for Ninja API
	const NINJA_BASE_URL = "https://api.beta.myninja.ai/v1"

	// Track the selected model for description display
	const [selectedModel, setSelectedModel] = useState(apiConfiguration?.planModeOpenAiModelId || DEFAULT_MODEL)
	const [hasInitializedFromFeatureFlag, setHasInitializedFromFeatureFlag] = useState(false)

	// Ensure the locked values are set in state if not already set
	useEffect(() => {
		if (apiConfiguration?.openAiBaseUrl !== NINJA_BASE_URL) {
			handleFieldChange("openAiBaseUrl", NINJA_BASE_URL)
		}

		// When feature flag loads, set the default model from it
		// Only do this once on initial load, not on subsequent changes
		if (modelOptionsPayload && !hasInitializedFromFeatureFlag) {
			handleFieldChange("planModeOpenAiModelId", DEFAULT_MODEL)
			handleFieldChange("actModeOpenAiModelId", DEFAULT_MODEL)
			setSelectedModel(DEFAULT_MODEL)
			setHasInitializedFromFeatureFlag(true)
			return
		}

		// After initial load, validate that current models are valid options
		if (hasInitializedFromFeatureFlag) {
			const currentPlanModelId = apiConfiguration?.planModeOpenAiModelId
			const currentActModelId = apiConfiguration?.actModeOpenAiModelId
			const isValidModel = (modelId: string | undefined) => modelId && MODEL_OPTIONS.some((opt) => opt.value === modelId)

			if (!isValidModel(currentPlanModelId)) {
				handleFieldChange("planModeOpenAiModelId", DEFAULT_MODEL)
				setSelectedModel(DEFAULT_MODEL)
			}
			if (!isValidModel(currentActModelId)) {
				handleFieldChange("actModeOpenAiModelId", DEFAULT_MODEL)
			}
		}
	}, [DEFAULT_MODEL, MODEL_OPTIONS, modelOptionsPayload, hasInitializedFromFeatureFlag]) // Re-run when model options change

	return (
		<div>
			{/* Locked Base URL for Ninja API */}
			<div className="mb-2.5">
				<div className="flex items-center gap-2 mb-1">
					<span style={{ fontWeight: 500 }}>Base URL</span>
					<i className="codicon codicon-lock text-[var(--vscode-descriptionForeground)] text-sm" />
				</div>
				<DebouncedTextField
					disabled={true}
					initialValue={NINJA_BASE_URL}
					onChange={() => {}}
					placeholder={NINJA_BASE_URL}
					style={{ width: "100%" }}
					type="url"
				/>
			</div>

			{/* Editable API Key - renamed to Ninja */}
			<ApiKeyField
				initialValue={apiConfiguration?.openAiApiKey || ""}
				onChange={(value) => {
					handleFieldChange("openAiApiKey", value)
				}}
				providerName="Ninja"
			/>

			{/* Model Selection Dropdown for Ninja API */}
			<div style={{ marginBottom: 10 }}>
				<div className="flex items-center gap-2 mb-1">
					<span style={{ fontWeight: 500 }}>Model</span>
				</div>
				<VSCodeDropdown
					onChange={(e: any) => {
						const newValue = e.target.value
						setSelectedModel(newValue)
						// Set both plan and act mode model IDs
						handleFieldChange("planModeOpenAiModelId", newValue)
						handleFieldChange("actModeOpenAiModelId", newValue)
					}}
					style={{ width: "100%" }}
					value={selectedModel}>
					{MODEL_OPTIONS.map((option) => (
						<VSCodeOption key={option.value} value={option.value}>
							{option.label}
						</VSCodeOption>
					))}
				</VSCodeDropdown>
				{/* Display description for selected model */}
				<p
					style={{
						fontSize: "12px",
						marginTop: 5,
						color: "var(--vscode-descriptionForeground)",
					}}>
					{MODEL_OPTIONS.find((opt) => opt.value === selectedModel)?.description}
				</p>
			</div>

			{/* Custom Headers - Disabled for Ninja API */}
			{(() => {
				const headerEntries = Object.entries(apiConfiguration?.openAiHeaders ?? {})

				return (
					<div style={{ marginBottom: 10 }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div className="flex items-center gap-2">
								<span style={{ fontWeight: 500 }}>Custom Headers</span>
								<i className="codicon codicon-lock text-[var(--vscode-descriptionForeground)] text-sm" />
							</div>
							<VSCodeButton disabled={true}>Add Header</VSCodeButton>
						</div>
						<div>
							{headerEntries.map(([key, value], index) => (
								<div key={index} style={{ display: "flex", gap: 5, marginTop: 5 }}>
									<DebouncedTextField
										disabled={true}
										initialValue={key}
										onChange={() => {}}
										placeholder="Header name"
										style={{ width: "40%" }}
									/>
									<DebouncedTextField
										disabled={true}
										initialValue={value}
										onChange={() => {}}
										placeholder="Header value"
										style={{ width: "40%" }}
									/>
									<VSCodeButton appearance="secondary" disabled={true}>
										Remove
									</VSCodeButton>
								</div>
							))}
						</div>
					</div>
				)
			})()}

			{/* Azure API Version - Disabled for Ninja API */}
			<BaseUrlField
				disabled={true}
				initialValue={apiConfiguration?.azureApiVersion}
				label="Set Azure API version"
				onChange={() => {}}
				placeholder={`Default: ${azureOpenAiDefaultApiVersion}`}
				showLockIcon={true}
			/>

			{/* Model Configuration - Disabled for Ninja API */}
			<div
				style={{
					color: getAsVar(VSC_DESCRIPTION_FOREGROUND),
					display: "flex",
					margin: "10px 0",
					alignItems: "center",
					opacity: 0.5,
				}}>
				<i className="codicon codicon-lock" style={{ marginRight: "4px" }} />
				<span
					style={{
						fontWeight: 700,
						textTransform: "uppercase",
					}}>
					Model Configuration (Locked)
				</span>
			</div>

			<p
				style={{
					fontSize: "12px",
					marginTop: 3,
					color: "var(--vscode-descriptionForeground)",
				}}>
				<span>Ninja API provides fast and capable AI assistance for your coding tasks.</span>
			</p>

			{showModelOptions && (
				<ModelInfoView isPopup={isPopup} modelInfo={selectedModelInfo} selectedModelId={selectedModelId} />
			)}
		</div>
	)
}
