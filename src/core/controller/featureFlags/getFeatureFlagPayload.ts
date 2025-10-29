import { FeatureFlagPayloadResponse, FeatureFlagRequest } from "@shared/proto/cline/feature_flags"
import { featureFlagsService } from "@/services/feature-flags"
import type { Controller } from "../index"

export async function getFeatureFlagPayload(
	_controller: Controller,
	request: FeatureFlagRequest,
): Promise<FeatureFlagPayloadResponse> {
	try {
		const payload = await featureFlagsService.getPayload(request.flagName)

		if (payload === null || payload === undefined) {
			return FeatureFlagPayloadResponse.create({
				payloadJson: undefined,
			})
		}

		return FeatureFlagPayloadResponse.create({
			payloadJson: JSON.stringify(payload),
		})
	} catch (error) {
		console.error(`Error getting feature flag payload for ${request.flagName}:`, error)
		return FeatureFlagPayloadResponse.create({
			payloadJson: undefined,
		})
	}
}
