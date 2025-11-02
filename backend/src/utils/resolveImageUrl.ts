import { supabaseService } from "../lib/supabase";

export async function resolvePublicImageUrlAndFixPath(
  itemId: number,
  imagePathFromDb: string,
  supabaseUrl: string
): Promise<string | null> {
  const pathParts = imagePathFromDb.split("/");
  const fileWithMaybeExt = pathParts[pathParts.length - 1]; // e.g. "test-jacket.png"
  const baseName = fileWithMaybeExt.split(".")[0]; // "test-jacket"

  const candidateExtensions = ["jpg", "png"];
  const folder = "bucket";
  const bucketName = "images";

  for (const ext of candidateExtensions) {
    const candidateFileName = `${baseName}.${ext}`;

    const { data, error } = await supabaseService.storage
      .from(bucketName)
      .list(folder, { search: candidateFileName });

    if (!error && Array.isArray(data)) {
      const match = data.find((f) => f.name === candidateFileName);
      if (match) {
        const correctPath = `images/${folder}/${candidateFileName}`;
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/${correctPath}`;

        // ✅ update database if path is wrong
        if (imagePathFromDb !== correctPath) {
          await supabaseService
            .from("closet_items")
            .update({ image_path: correctPath })
            .eq("id", itemId);
        }

        return imageUrl;
      }
    }
  }

  return null;
}
