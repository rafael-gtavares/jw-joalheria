// Fonte única de verdade para as categorias de peças no front-end.
// Para adicionar, remover ou renomear uma categoria, altere SOMENTE este arquivo.
// Mantenha em sincronia com backend/src/constants/categories.js

export const CATEGORIES = ["Anéis", "Brincos", "Colares", "Pulseiras", "Broches"];

export const CATEGORIES_WITH_ALL = ["Todas", ...CATEGORIES];

export const COLLECTIONS = ["Origem", "Bauhaus"];

export default CATEGORIES;
