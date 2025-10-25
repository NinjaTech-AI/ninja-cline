import { StringRequest } from "@shared/proto/cline/common"
import { useAccountBalance } from "@/components/ui/hooks/useAccountBalance"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { UiServiceClient } from "@/services/grpc-client"

const BalanceInfoBlock = () => {
	const { apiConfiguration } = useExtensionState()
	const { data, isLoading, error } = useAccountBalance()

	const handleManageClick = async () => {
		if (!apiConfiguration?.openAiBaseUrl) {
			return
		}
		let myninjaUrl = "https://myninja.ai"

		if (apiConfiguration.openAiBaseUrl.includes("beta")) {
			myninjaUrl = "https://betamyninja.ai"
		}
		if (apiConfiguration.openAiBaseUrl.includes("gamma")) {
			myninjaUrl = "https://gammamyninja.ai"
		}

		try {
			const manageUrl = `${myninjaUrl}/add-on/credits?from_SN=true`
			await UiServiceClient.openUrl(StringRequest.create({ value: manageUrl }))
		} catch (error) {
			console.error("Error opening manage balance URL:", error)
		}
	}

	// Don't render if API is not configured
	if (!apiConfiguration?.openAiBaseUrl) {
		return null
	}

	// Don't render while loading and no cached data
	if (isLoading && !data) {
		return (
			<div className="mx-4 mt-3 mb-2 px-4 py-3 bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg flex items-center justify-between">
				<span className="text-sm text-[var(--vscode-descriptionForeground)]">Loading balance...</span>
			</div>
		)
	}

	// Show error state but don't block UI
	if (error && !data) {
		return null // Silently fail if no cached data
	}

	// Don't render if no data available
	if (!data) {
		return null
	}

	// Convert balance_nanos to dollars (Long/BigInt to number)
	const balanceNanos = typeof data.balanceNanos === "bigint" ? Number(data.balanceNanos) : data.balanceNanos
	const balanceInDollars = balanceNanos / 1_000_000_000

	return (
		<div className="mt-3 mb-2 px-4 py-3 bg-[#EAEBEC] flex items-center justify-between">
			<div className="flex flex-col">
				<span className="text-sm font-semibold text-[var(--vscode-foreground)]">
					${balanceInDollars.toFixed(2)} credits available
				</span>
			</div>
			<button
				className="px-4 py-2 bg-[var(--vscode-button-background)] hover:bg-[var(--vscode-button-hoverBackground)] text-[var(--vscode-button-foreground)] rounded-full text-sm font-medium transition-colors cursor-pointer border-none"
				onClick={handleManageClick}
				type="button">
				Manage
			</button>
		</div>
	)
}

export default BalanceInfoBlock
