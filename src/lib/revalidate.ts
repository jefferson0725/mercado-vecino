import { revalidatePath } from "next/cache";

export function revalidateBusinessPages(conjuntoSlug: string, businessSlug: string) {
  revalidatePath(`/${conjuntoSlug}`);
  // "layout" cubre también las páginas de producto anidadas
  revalidatePath(`/${conjuntoSlug}/${businessSlug}`, "layout");
  revalidatePath("/dashboard");
}
