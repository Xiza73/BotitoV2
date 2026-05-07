import ErrorHandler from "../../handlers/ErrorHandler";
import ResponseBase from "../../handlers/ResponseBase";
import ResponseData from "../../handlers/ResponseData";
import Love, { ILove } from "../models/Love";

/**
 * Stable key for a pair of user IDs. Sort first so the order of arguments
 * is irrelevant: pairKey("a","b") === pairKey("b","a").
 */
export const buildPairKey = (id1: string, id2: string): string =>
  [id1, id2].sort().join("-");

/**
 * djb2-ish 32-bit hash, deterministic per input string.
 * Lives here (not in the slash command) so DAO test fixtures can predict
 * the auto-populated percentage.
 */
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h | 0;
  }
  return Math.abs(h);
};

export const computeAutoPercentage = (id1: string, id2: string): number =>
  hashString(buildPairKey(id1, id2)) % 101;

/**
 * Reads the pair from Mongo. If it doesn't exist, creates it with the
 * auto-computed percentage. Either way, returns the persisted document.
 */
export const getOrCreatePair = async (id1: string, id2: string) => {
  try {
    if (!id1 || !id2) {
      return new ErrorHandler(400, "Faltan los IDs de usuario");
    }

    const pairKey = buildPairKey(id1, id2);
    const existing = await Love.findOne({ pairKey });
    if (existing) {
      return ResponseData(200, "Pareja encontrada", existing);
    }

    const created: ILove = new Love({
      pairKey,
      user1: id1,
      user2: id2,
      percentage: computeAutoPercentage(id1, id2),
      verdict: null,
      isOverride: false,
      setBy: null,
    });
    await created.save();
    return ResponseData(200, "Pareja creada", created);
  } catch (err) {
    return new ErrorHandler(500, "Error al obtener/crear la pareja");
  }
};

/**
 * Marks the pair as admin-overridden. Upserts: works even if the pair has
 * never been queried before. Used by /love set.
 */
export const setOverride = async (
  id1: string,
  id2: string,
  percentage: number,
  verdict: string | null,
  setBy: string
) => {
  try {
    if (!id1 || !id2) {
      return new ErrorHandler(400, "Faltan los IDs de usuario");
    }
    if (percentage < 0 || percentage > 100) {
      return new ErrorHandler(422, "El porcentaje debe estar entre 0 y 100");
    }

    const pairKey = buildPairKey(id1, id2);
    const updated = await Love.findOneAndUpdate(
      { pairKey },
      {
        $set: {
          user1: id1,
          user2: id2,
          percentage,
          verdict,
          isOverride: true,
          setBy,
        },
        $setOnInsert: { pairKey },
      },
      { new: true, upsert: true }
    );
    return ResponseData(200, "Override aplicado", updated);
  } catch (err) {
    return new ErrorHandler(500, "Error al aplicar el override");
  }
};

/**
 * Removes the pair from Mongo. The next /love call will re-create it from
 * the deterministic hash. Used by /love reset.
 */
export const resetPair = async (id1: string, id2: string) => {
  try {
    if (!id1 || !id2) {
      return new ErrorHandler(400, "Faltan los IDs de usuario");
    }

    const pairKey = buildPairKey(id1, id2);
    const deleted = await Love.findOneAndDelete({ pairKey });
    if (!deleted) {
      return new ErrorHandler(404, "La pareja no estaba registrada");
    }
    return ResponseBase(200, "Pareja reseteada");
  } catch (err) {
    return new ErrorHandler(500, "Error al resetear la pareja");
  }
};
