import { FeatureFlagRequest, FeatureFlagResponse } from "@shared/proto/cline/feature_flags"
import { featureFlagsService } from "@/services/feature-flags"
import type { Controller } from "../index"

export async function getFeatureFlag(_controller: Controller, request: FeatureFlagRequest): Promise<FeatureFlagResponse> {
	try {
		const provider = featureFlagsService.getProvider()
		const flagValue = await provider.getFeatureFlag(request.flagName)

		if (flagValue === undefined) {
			return FeatureFlagResponse.create({
				enabled: undefined,
				value: undefined,
			})
		}

		if (typeof flagValue === "boolean") {
			return FeatureFlagResponse.create({
				enabled: flagValue,
				value: undefined,
			})
		}

		return FeatureFlagResponse.create({
			enabled: true,
			value: String(flagValue),
		})
	} catch (error) {
		console.error(`Error getting feature flag ${request.flagName}:`, error)
		return FeatureFlagResponse.create({
			enabled: undefined,
			value: undefined,
		})
	}
}
