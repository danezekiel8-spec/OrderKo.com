export type MenuOption = {
  name: string;
  priceCents: number;
};

export type MenuOptionGroup = {
  name: string;
  required?: boolean;
  maxChoices: number;
  options: MenuOption[];
};

export function parseOptionGroups(value: string | null | undefined): MenuOptionGroup[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as MenuOptionGroup[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((group) => group?.name && Array.isArray(group.options))
      .map((group) => ({
        name: String(group.name),
        required: Boolean(group.required),
        maxChoices: Number(group.maxChoices || 1),
        options: group.options
          .filter((option) => option?.name)
          .map((option) => ({
            name: String(option.name),
            priceCents: Number(option.priceCents || 0),
          })),
      }));
  } catch {
    return [];
  }
}

export function safeJson(value: unknown) {
  return JSON.stringify(value ?? []);
}
