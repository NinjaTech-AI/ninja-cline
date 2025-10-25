import { AccountBalanceData, GetAccountBalanceRequest } from "@shared/proto/cline/account"
import axios from "axios"
import type { Controller } from "../index"

/**
 * Fetches account balance from the OpenAI-compatible API endpoint
 * @param controller The controller instance
 * @param request Request with API base URL and API key
 * @returns Account balance data with balance_nanos and keys_status
 */
export async function getAccountBalance(_controller: Controller, request: GetAccountBalanceRequest): Promise<AccountBalanceData> {
	try {
		if (!request.apiBaseUrl || !request.apiKey) {
			throw new Error("API base URL and API key are required")
		}

		const response = await axios.get(`${request.apiBaseUrl}/account_balance`, {
			headers: {
				Authorization: `Bearer ${request.apiKey}`,
			},
		})

		if (response.data && typeof response.data.balance_nanos === "number" && typeof response.data.keys_status === "string") {
			return AccountBalanceData.create({
				balanceNanos: response.data.balance_nanos,
				keysStatus: response.data.keys_status,
			})
		}

		throw new Error("Invalid response format from account_balance endpoint")
	} catch (error) {
		console.error("Failed to fetch account balance:", error)
		throw error
	}
}
