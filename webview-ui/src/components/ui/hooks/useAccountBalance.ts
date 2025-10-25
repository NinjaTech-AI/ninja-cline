import type { AccountBalanceData } from "@shared/proto/cline/account"
import { GetAccountBalanceRequest } from "@shared/proto/cline/account"
import { LogLevel, LogMessageRequest } from "@shared/proto/cline/common"
import { useEffect, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { AccountServiceClient, UiServiceClient } from "@/services/grpc-client"

// Module-level cache variables
let moduleCachedData: AccountBalanceData | null = null
let moduleLastFetchTime: number | null = null

const CACHE_DURATION_MS = 30000 // 30 seconds

/**
 * Custom hook to fetch account balance information via gRPC.
 * Implements stale-while-revalidate caching using module-level variables.
 * @returns An object containing the balance data, loading state, and error state.
 */
export const useAccountBalance = () => {
	const { apiConfiguration } = useExtensionState()
	const [data, setData] = useState<AccountBalanceData | null>(moduleCachedData)
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		// Don't fetch if API configuration is not available
		if (!apiConfiguration?.openAiBaseUrl || !apiConfiguration?.openAiApiKey) {
			setData(null)
			setIsLoading(false)
			setError(null)
			return
		}

		const controller = new AbortController()
		const { signal } = controller

		const now = Date.now()
		const hasCache = moduleCachedData !== null && moduleLastFetchTime !== null
		const isCacheStale = hasCache && now - moduleLastFetchTime! > CACHE_DURATION_MS

		// Show cached data immediately if available
		if (hasCache && !signal.aborted) {
			setData(moduleCachedData)
			setError(null)
			setIsLoading(false)
		} else {
			setIsLoading(true)
			setError(null)
		}

		// Fetch if cache is stale or doesn't exist
		if (isCacheStale || !hasCache) {
			const isBackgroundFetch = hasCache && isCacheStale

			// Don't set loading true for background fetches
			if (!isBackgroundFetch) {
				setIsLoading(true)
			}

			// Use gRPC to fetch account balance, passing API configuration from state
			AccountServiceClient.getAccountBalance(
				GetAccountBalanceRequest.create({
					apiBaseUrl: apiConfiguration.openAiBaseUrl,
					apiKey: apiConfiguration.openAiApiKey,
				}),
			)
				.then((result) => {
					if (!signal.aborted) {
						moduleCachedData = result
						moduleLastFetchTime = Date.now()
						setData(result)
						setError(null)

						// Log success
						UiServiceClient.logMessage(
							LogMessageRequest.create({
								level: LogLevel.LOG_INFO,
								message: `Account balance fetched successfully: ${result.balanceNanos} nanos`,
							}),
						).catch((logErr) => {
							console.error("Failed to log to extension:", logErr)
						})
					}
				})
				.catch((err) => {
					if (!signal.aborted) {
						const errorMessage = `[useAccountBalance] Fetch error: ${err instanceof Error ? err.message : err}`

						// Log to extension output channel
						UiServiceClient.logMessage(
							LogMessageRequest.create({
								level: LogLevel.LOG_ERROR,
								message: errorMessage,
								errorStack: err instanceof Error ? err.stack : undefined,
							}),
						).catch((logErr) => {
							console.error("Failed to log to extension:", logErr)
						})

						console.error(errorMessage, err)
						setError(err instanceof Error ? err : new Error("An unknown error occurred"))

						if (!isBackgroundFetch) {
							setData(null)
							moduleCachedData = null
							moduleLastFetchTime = null
						}
					}
				})
				.finally(() => {
					if (!signal.aborted) {
						setIsLoading(false)
					}
				})
		}

		return () => {
			controller.abort()
		}
	}, [apiConfiguration?.openAiBaseUrl, apiConfiguration?.openAiApiKey]) // Re-fetch if API configuration changes

	return { data, isLoading, error }
}
