import { azureOpenAiDefaultApiVersion } from "@shared/api"
import { OpenAiModelsRequest } from "@shared/proto/cline/models"
import { Mode } from "@shared/storage/types"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useEffect, useRef } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { ModelsServiceClient } from "@/services/grpc-client"
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
 * The OpenAI Compatible provider configuration component
 */
export const OpenAICompatibleProvider = ({ showModelOptions, isPopup, currentMode }: OpenAICompatibleProviderProps) => {
	const { apiConfiguration } = useExtensionState()
	const { handleFieldChange, handleModeFieldChange } = useApiConfigurationHandlers()

	// Get the normalized configuration
	const { selectedModelId, selectedModelInfo } = normalizeApiConfiguration(apiConfiguration, currentMode)

	// Debounced function to refresh OpenAI models (prevents excessive API calls while typing)
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [])

	const debouncedRefreshOpenAiModels = useCallback((baseUrl?: string, apiKey?: string) => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current)
		}

		if (baseUrl && apiKey) {
			debounceTimerRef.current = setTimeout(() => {
				ModelsServiceClient.refreshOpenAiModels(
					OpenAiModelsRequest.create({
						baseUrl,
						apiKey,
					}),
				).catch((error) => {
					console.error("Failed to refresh OpenAI models:", error)
				})
			}, 500)
		}
	}, [])

	// Set locked values for Ninja API
	const NINJA_BASE_URL = "https://api.beta.myninja.ai/v1"
	const NINJA_MODEL_ID = "alibaba:qwen-3-480b-cerebras"

	// Ensure the locked values are set in state if not already set
	// Note: If NINJA_API_BASE_URL env var is set, it will already be in apiConfiguration.openAiBaseUrl
	useEffect(() => {
		// Only update if value is empty or doesn't match expected value (unless overridden by env var)
		if (apiConfiguration?.openAiBaseUrl !== NINJA_BASE_URL && !apiConfiguration?.openAiBaseUrl) {
			handleFieldChange("openAiBaseUrl", NINJA_BASE_URL)
		}
		if (selectedModelId !== NINJA_MODEL_ID && !selectedModelId) {
			handleModeFieldChange({ plan: "planModeOpenAiModelId", act: "actModeOpenAiModelId" }, NINJA_MODEL_ID, currentMode)
		}
	}, []) // Only run on mount

	return (
		<div>
			{/* Locked Base URL for Ninja API (may be overridden by NINJA_API_BASE_URL env var) */}
			<div className="mb-2.5">
				<div className="flex items-center gap-2 mb-1">
					<span style={{ fontWeight: 500 }}>Base URL</span>
					<i className="codicon codicon-lock text-[var(--vscode-descriptionForeground)] text-sm" />
				</div>
				<DebouncedTextField
					disabled={true}
					initialValue={apiConfiguration?.openAiBaseUrl || NINJA_BASE_URL}
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
					debouncedRefreshOpenAiModels(NINJA_BASE_URL, value)
				}}
				providerName="Ninja"
			/>

			{/* Locked Model ID for Ninja API */}
			<div style={{ marginBottom: 10 }}>
				<div className="flex items-center gap-2 mb-1">
					<span style={{ fontWeight: 500 }}>Model ID</span>
					<i className="codicon codicon-lock text-[var(--vscode-descriptionForeground)] text-sm" />
				</div>
				<DebouncedTextField
					disabled={true}
					initialValue={NINJA_MODEL_ID}
					onChange={() => {}}
					placeholder={NINJA_MODEL_ID}
					style={{ width: "100%" }}
				/>
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
				<span>
					Ninja API is powered by Alibaba Qwen 3 480B Cerebras, providing fast and capable AI assistance for your coding
					tasks.
				</span>
			</p>

			{showModelOptions && (
				<ModelInfoView isPopup={isPopup} modelInfo={selectedModelInfo} selectedModelId={selectedModelId} />
			)}
		</div>
	)
}
