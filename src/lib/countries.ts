export type Country = {
  /** Código ISO de 2 letras */
  code: string;
  name: string;
  /** Indicativo telefónico, solo dígitos */
  dial: string;
  flag: string;
};

// Colombia primero (es el país por defecto); luego el resto de Latinoamérica
// y países comunes, en orden alfabético.
export const COUNTRIES: Country[] = [
  { code: "CO", name: "Colombia", dial: "57", flag: "🇨🇴" },
  { code: "AR", name: "Argentina", dial: "54", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴" },
  { code: "BR", name: "Brasil", dial: "55", flag: "🇧🇷" },
  { code: "CA", name: "Canadá", dial: "1", flag: "🇨🇦" },
  { code: "CL", name: "Chile", dial: "56", flag: "🇨🇱" },
  { code: "CR", name: "Costa Rica", dial: "506", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", dial: "53", flag: "🇨🇺" },
  { code: "EC", name: "Ecuador", dial: "593", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", dial: "503", flag: "🇸🇻" },
  { code: "ES", name: "España", dial: "34", flag: "🇪🇸" },
  { code: "US", name: "Estados Unidos", dial: "1", flag: "🇺🇸" },
  { code: "GT", name: "Guatemala", dial: "502", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", dial: "504", flag: "🇭🇳" },
  { code: "MX", name: "México", dial: "52", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", dial: "505", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", dial: "507", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾" },
  { code: "PE", name: "Perú", dial: "51", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", dial: "58", flag: "🇻🇪" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Colombia

/**
 * Separa un número completo (ej. "573001112233") en país y número local,
 * probando los indicativos más largos primero. Si nada coincide, Colombia.
 */
export function splitPhone(full: string): { country: Country; number: string } {
  const digits = full.replace(/\D/g, "");
  if (digits) {
    // Indicativos largos primero; en empates (+1), Estados Unidos antes que Canadá
    const byLongestDial = [...COUNTRIES].sort(
      (a, b) =>
        b.dial.length - a.dial.length ||
        Number(b.code === "US") - Number(a.code === "US")
    );
    for (const country of byLongestDial) {
      if (digits.startsWith(country.dial) && digits.length > country.dial.length) {
        return { country, number: digits.slice(country.dial.length) };
      }
    }
  }
  return { country: DEFAULT_COUNTRY, number: digits };
}
