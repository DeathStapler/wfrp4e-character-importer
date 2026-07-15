/**
 * Actor builder module for the WFRP 4e Character Importer.
 *
 * Creates the Foundry Actor and populates core actor system data
 * (characteristics, details, status, experience, fate, resilience).
 *
 * @module actorBuilder
 */

import { info, debug } from "./logger.js";
import { clamp } from "./utilities.js";
import {
  CHARACTERISTIC_MAP,
  CHARACTERISTIC_PATH,
  SPECIES_MAP,
  ACTOR_PATH,
} from "./mappings.js";

/**
 * Build the base actor data for Actor.create().
 *
 * @param {object} data - The export JSON data.
 * @returns {object} Base actor data object.
 */
export function buildBaseActorData(data) {
  const name = data.metadata?.name ?? "Unknown Character";
  return {
    name,
    type: "character",
  };
}

/**
 * Build the characteristic updates from export JSON.
 *
 * Maps characteristicBases to system.characteristics.*.initial
 * and characteristicAdvances to system.characteristics.*.advances.
 *
 * @param {object} data - The export JSON data.
 * @returns {object} Update object for actor.update() targeting characteristics.
 */
export function buildCharacteristicUpdates(data) {
  const updates = {};

  const bases = data.characteristicBases ?? {};
  const advances = data.characteristicAdvances ?? {};

  for (const [exportKey, systemKey] of Object.entries(CHARACTERISTIC_MAP)) {
    const basePath = `${CHARACTERISTIC_PATH}.${systemKey}.initial`;
    const advPath = `${CHARACTERISTIC_PATH}.${systemKey}.advances`;

    if (bases[exportKey] != null) {
      updates[basePath] = clamp(bases[exportKey], 0, 100);
    }
    if (advances[exportKey] != null) {
      updates[advPath] = clamp(advances[exportKey], 0, 100);
    }
  }

  return updates;
}

/**
 * Build the core details updates from export JSON metadata.
 *
 * Maps species, age, eyes, hair, height, weight to actor system paths.
 *
 * @param {object} data - The export JSON data.
 * @returns {object} Update object for actor.update() targeting details.
 */
export function buildDetailsUpdates(data) {
  const updates = {};
  const meta = data.metadata ?? {};

  // Species
  const speciesId = meta.speciesId ?? "";
  const systemSpeciesKey = SPECIES_MAP[speciesId] ?? speciesId;
  updates[ACTOR_PATH.SPECIES] = systemSpeciesKey;

  // Other details
  if (meta.age != null) updates[ACTOR_PATH.AGE] = String(meta.age);
  if (meta.eyes) updates[ACTOR_PATH.EYES] = meta.eyes;
  if (meta.hair) updates[ACTOR_PATH.HAIR] = meta.hair;
  if (meta.height) updates[ACTOR_PATH.HEIGHT] = meta.height;
  if (meta.weight) updates[ACTOR_PATH.WEIGHT] = meta.weight;

  // Notes/backstory
  if (data.notes) updates[ACTOR_PATH.BIOGRAPHY] = data.notes;

  return updates;
}

/**
 * Build the status updates from export JSON.
 *
 * Maps fate, fortune, resilience, resolve, wounds, advantage, corruption, sin.
 *
 * @param {object} data - The export JSON data.
 * @returns {object} Update object for actor.update() targeting status.
 */
export function buildStatusUpdates(data) {
  const updates = {};

  // Fate and Fortune
  const fate = data.fate ?? {};
  if (fate.total != null) {
    updates[ACTOR_PATH.FATE] = clamp(fate.total, 0, 20);
    // Fortune = fate - burned
    const burned = fate.burned ?? 0;
    updates[ACTOR_PATH.FORTUNE] = clamp(fate.total - burned, 0, 20);
  }

  // Resilience and Resolve
  const resilience = data.resilience ?? {};
  if (resilience.total != null) {
    updates[ACTOR_PATH.RESILIENCE] = clamp(resilience.total, 0, 20);
    const burned = resilience.burned ?? 0;
    updates[ACTOR_PATH.RESOLVE] = clamp(resilience.total - burned, 0, 20);
  }

  // Wounds
  const status = data.status ?? {};
  if (status.currentWounds != null) {
    updates[ACTOR_PATH.WOUNDS_VALUE] = clamp(status.currentWounds, 0, 100);
  }

  // Advantage
  if (status.advantage != null) {
    updates[ACTOR_PATH.ADVANTAGE] = clamp(status.advantage, 0, 10);
  }

  // Corruption
  const corruption = data.corruption ?? {};
  if (corruption.taint != null) {
    updates[ACTOR_PATH.CORRUPTION] = clamp(corruption.taint, 0, 100);
  }

  // Sin
  if (data.sinPoints != null) {
    updates[ACTOR_PATH.SIN] = clamp(data.sinPoints, 0, 100);
  }

  return updates;
}

/**
 * Build the experience updates from export JSON.
 *
 * @param {object} data - The export JSON data.
 * @returns {object} Update object for actor.update() targeting experience.
 */
export function buildExperienceUpdates(data) {
  const updates = {};
  const exp = data.experience ?? {};

  if (exp.total != null) {
    updates[ACTOR_PATH.EXPERIENCE_TOTAL] = clamp(exp.total, 0, Infinity);
  }
  if (exp.spent != null) {
    updates[ACTOR_PATH.EXPERIENCE_SPENT] = clamp(exp.spent, 0, Infinity);
  }

  return updates;
}

/**
 * Build the movement update from species config.
 *
 * @param {object} data - The export JSON data.
 * @returns {object} Update object for actor.update() targeting movement.
 */
export function buildMovementUpdate(data) {
  const updates = {};
  const speciesId = data.metadata?.speciesId ?? "";
  const systemSpeciesKey = SPECIES_MAP[speciesId] ?? speciesId;

  const config = game?.wfrp4e?.config;
  if (config?.speciesMovement?.[systemSpeciesKey] != null) {
    updates[ACTOR_PATH.MOVE] = config.speciesMovement[systemSpeciesKey];
  }

  return updates;
}

/**
 * Create a Foundry Actor from the export JSON.
 *
 * Creates an empty character actor, then populates core system data
 * (characteristics, details, status, experience) via separate updates.
 *
 * @param {object} data - The export JSON data.
 * @returns {Promise<Actor>} The created Actor document.
 * @throws {Error} If actor creation fails.
 */
export async function createActor(data) {
  const baseData = buildBaseActorData(data);
  info(`Creating actor "${baseData.name}"...`);

  const actor = await Actor.create(baseData);
  if (!actor) {
    throw new Error(`Failed to create actor "${baseData.name}".`);
  }

  debug(`Actor created with ID: ${actor.id}`);

  // Populate core actor fields via separate updates
  const charUpdates = buildCharacteristicUpdates(data);
  const detailUpdates = buildDetailsUpdates(data);
  const statusUpdates = buildStatusUpdates(data);
  const expUpdates = buildExperienceUpdates(data);
  const moveUpdates = buildMovementUpdate(data);

  const allUpdates = {
    ...charUpdates,
    ...detailUpdates,
    ...statusUpdates,
    ...expUpdates,
    ...moveUpdates,
  };

  if (Object.keys(allUpdates).length > 0) {
    await actor.update(allUpdates);
    debug(`Applied ${Object.keys(allUpdates).length} core field updates to actor.`);
  }

  info(`Actor "${actor.name}" core data populated.`);
  return actor;
}

/**
 * Configure the prototype token for the created actor.
 *
 * @param {Actor} actor - The actor to configure.
 * @returns {Promise<void>}
 */
export async function configurePrototypeToken(actor) {
  await actor.prototypeToken.update({
    name: actor.name,
    displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
    disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
  });
  debug(`Prototype token configured for "${actor.name}".`);
}
