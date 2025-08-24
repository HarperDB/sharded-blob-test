import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import assert from "node:assert";
const DEFAULT_TTL_IN_SEC = 10 * 24 * 60 * 60;

const {ItemAttributes} = tables;

const numOfShards = 10;

export function shardResidency(cacheKey) {
	const params = new URLSearchParams(cacheKey);
	const itemId = params.get("itemId");
	const lastChar = itemId ? itemId[itemId.length - 1] : undefined;
	if (!itemId || !lastChar) {
		return numOfShards; // fallback shard number if itemId is missing or empty
	}
	if (/\d/.test(lastChar)) {
		// Check if the last character is a digit
		if (lastChar === "0") {
			// If the last character is '0', we assign it to the last shard
			return numOfShards;
		}
		// Convert lastChar to number for modulo operation, then make 1-based
		const shardNum = ((Number(lastChar) - 1) % numOfShards) + 1;
		return shardNum;
	}
	return numOfShards; // If the last character is not a digit, we assign it to the last shard
}
ItemAttributes.setResidencyById((cacheKey) => {
	return shardResidency(cacheKey);
});

export const htmlTagsExist = (attribute) => {
	// Only check string values for HTML tags
	if (
		typeof attribute === "true" ||
		attribute === "false" ||
		typeof attribute === "boolean"
	) {
		return false;
	}

	const window = new JSDOM("").window;
	const purify = DOMPurify(window);
	const clean = purify.sanitize(attribute, { ALLOWED_TAGS: [] });
	return clean !== attribute;
};

export const sanitizeJsonInput = async (jsonArray) => {
	const sanitizedArray = [];
	const filteredOutArray = [];

	for (const jsonObj of jsonArray) {
		// yield to the event turn on every iteration, since each iteration is very expensive. You can
		// also use Node's promise-based timer functions, but this is a self-encapsulated way to do this. And if we need to be even "nicer" with our yielding, we could use a timer with a 1 millisecond delay rather than setImmediate. Also you could do this at the end of each loop, might look better:
		await new Promise(setImmediate);
		let hasHtmlTags = false;

		for (const key in jsonObj) {
			const value = jsonObj[key];
			if (typeof value === "string" && htmlTagsExist(value)) {
				hasHtmlTags = true;
				break;
			}
		}

		if (hasHtmlTags) {
			filteredOutArray.push(jsonObj); // Add to filtered-out array
		} else {
			sanitizedArray.push(jsonObj); // Add to sanitized array
		}
	}

	return { sanitizedArray, filteredOutArray };
};



export const validations = {
	currentPrice: {
		validation: (value) =>
			typeof value === "string" &&
			value.trim() !== "" &&
			/^\d+(\.\d+)?$/.test(value),
		errorMessage:
			"Invalid currentPrice. It should be a non-empty string consisting of numbers.",
	},
	wasPrice: {
		validation: (value) => value === "-1" || /^[¢$]\d+(\.\d+)?$/.test(value),
		errorMessage:
			"Invalid wasPrice. It should be either -1 or start with a currency symbol followed by numbers.",
	},
	unitPrice: {
		validation: (value) =>
			typeof value === "string" &&
			value.trim() !== "" &&
			/^\d+(\.\d+)?\s*[^¢$]*\s*[¢$]\s*[^¢$]*\s*\/\s*.*$/.test(value),
		errorMessage:
			'Invalid unitPrice. It should be a non-empty string starting with numbers and contain a currency symbol and "/".',
	},
	title: {
		validation: (value) => typeof value === "string" && value.trim() !== "",
		errorMessage: "Invalid title. It should be a non-empty string.",
	},
	brand: {
		validation: (value) => typeof value === "string" && value.trim() !== "",
		errorMessage: "Invalid brand. It should be a non-empty string.",
	},
	imageUrl: {
		validation: (value) =>
			typeof value === "string" &&
			value.trim() !== "" &&
			/^https:\/\/[^\s/$.?#].[^\s]*$/.test(value),
		errorMessage:
			"Invalid imageUrl. It should be a non-empty string and a valid URL format.",
	},
	availabilityStatus: {
		validation: (value) => value === "IN_STOCK" || value === "OUT_OF_STOCK",
		errorMessage:
			"Invalid availabilityStatus. It should be either IN_STOCK or OUT_OF_STOCK.",
	},
	twoDayShipping: {
		validation: (value) => typeof value === "boolean",
		errorMessage: "Invalid twoDayShipping. It should be a boolean.",
	},
};

export const validateCacheKey = (cacheKey) => {
	if (typeof cacheKey !== "string") {
		return false;
	}
	const pattern = /^itemId=[a-zA-Z0-9]+(?:&sellerId=\d+)?$/;
	return pattern.test(cacheKey);
};

export const validateEachEntryAndGetError = (item) => {
	const isCacheKeyValid = validateCacheKey(item.cacheKey);
	if (!isCacheKeyValid) {
		return "Invalid cacheKey";
	}
	const keysToCheck = [
		"currentPrice",
		"title",
		"wasPrice",
		"unitPrice",
		"imageUrl",
		"brand",
		"availabilityStatus",
		"twoDayShipping",
	];
	const errors = [];
	let hasValidKey = false;

	for (const key of keysToCheck) {
		if (key in item) {
			hasValidKey = true;
			const { validation, errorMessage } = validations[key];
			if (!validation(item[key])) {
				errors.push(errorMessage);
			}
		}
	}

	if (!hasValidKey) {
		errors.push("At least one attribute is required");
	}
	return errors;
};

// Singleton JSDOM window and DOMPurify instance
let globalWindow, globalPurify;
function initializeGlobalSanitizer() {
	if (!globalWindow) {
		globalWindow = new JSDOM("").window;
		globalPurify = DOMPurify(globalWindow);
	}
}

export function htmlTagsExistOptimized(attribute) {
	if (typeof attribute !== "string") return false;
	initializeGlobalSanitizer();
	// Remove all tags, not just dangerous ones
	const clean = globalPurify.sanitize(attribute, { ALLOWED_TAGS: [] });
	return clean !== attribute;
}

// This function sanitizes an array of JSON objects
// by removing any objects that contain HTML tags in their attributes.
// Used for update operations where entries are JSON objects.
 export async function sanitizeJsonInputOptimized(jsonArray) {
	const sanitizedArray = [];
	const filteredOutArray = [];
	for (const jsonObj of jsonArray) {
		await new Promise(setImmediate);
		let hasHtmlTags = false;
		for (const key in jsonObj) {
			if (htmlTagsExistOptimized(jsonObj[key])) {
				hasHtmlTags = true;
				break;
			}
		}
		if (hasHtmlTags) {
			filteredOutArray.push(jsonObj);
		} else {
			sanitizedArray.push(jsonObj);
		}
	}
	return { sanitizedArray, filteredOutArray };
}

export class itemattributes extends Resource {
	async post(payload) {
		const invalidEntries = [];

		const {
			sanitizedArray: sanitizedPayload,
			filteredOutArray: excludedEntries,
		} = await sanitizeJsonInputOptimized(payload);

		// Step 3: Process the sanitized payload
		const totalEntries = sanitizedPayload.length;
		let promises = new Array(500);
		for (let i = 0; i < totalEntries; i++) {
			// Perform the update operation
			const entry = sanitizedPayload[i];

			let validationErrors = validateEachEntryAndGetError(entry);
			if (validationErrors.length === 0) {
				// Step 3.2: Circular buffer of 500 promises to limit concurrency
				// This ensures that we do not overwhelm the database with too many concurrent requests
				// and also helps in managing memory usage effectively.
				await promises[i % 500]; // await the oldest entry in this queue (noop on first loop through queue)

				const shardNumber = shardResidency(entry.cacheKey);

				promises[i % 500] = ItemAttributes.patch(
					{
						...entry,
						ttl: DEFAULT_TTL_IN_SEC,
						updatedTimestamp: Date.now().toString(),
						shardNumber,
					},
					{ expiresAt: Date.now() + DEFAULT_TTL_IN_SEC * 1000 },
				);

			} else {
				invalidEntries.push({
					cacheKey: entry.cacheKey,
					error: validationErrors,
				});
			}
		}

		return {
			status: "SUCCESS",
			message: "Records Inserted/Updated",
		};
	}
}