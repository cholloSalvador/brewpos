import { getAuthUser } from "./auth";

export async function getStoreIdFromAuth(): Promise<number> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  if (!user.storeId) throw new Error("No store assigned");
  return user.storeId;
}
