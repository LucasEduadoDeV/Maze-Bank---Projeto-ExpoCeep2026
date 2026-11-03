import { changeUserThemeRepository, findUserById } from "../repositories/me.repository";
import { AppError } from "../errors/AppError";

export async function changeUserThemeService(userId: string) {
    const user = await findUserById(userId)

    if (!user) {
        throw new AppError("Usuário não encontrado.", 404)
    }

    const userTheme = await changeUserThemeRepository(userId)

    if (!userTheme) {
        throw new AppError("Erro inesperado, tente novamente.", 500)
    }

    return userTheme;
}