import { prisma } from "@/lib/prisma";
import { apiError, getCurrentUser, parseJson } from "@/lib/utils";
import { updateUserProfileSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const data = updateUserProfileSchema.parse(await parseJson(request, {}));
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data
    });
    return Response.json(user);
  } catch (error) {
    return apiError(error);
  }
}
