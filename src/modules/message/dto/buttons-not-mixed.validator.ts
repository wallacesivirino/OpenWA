import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Whether a send-buttons list keeps to one kind: all quick replies, or all call-to-action buttons
 * (copy / link).
 *
 * A message that mixes a quick reply with a cta_copy or cta_url button is delivered and renders on
 * the phone, but WhatsApp Web shows it as "Couldn't load message" (tested 2026-10-29: quick reply
 * alone and copy + link alone both render on Web; quick reply + copy does not). Refused here so a
 * caller learns at send time instead of from a recipient on the desktop client.
 */
export function buttonsNotMixed(value: unknown): boolean {
  if (!Array.isArray(value)) return true; // shape errors belong to @IsArray / @ValidateNested
  const isCta = (b: unknown) => {
    if (!b || typeof b !== 'object') return false;
    const { copyCode, url } = b as { copyCode?: unknown; url?: unknown };
    return copyCode !== undefined || url !== undefined;
  };
  const cta = value.filter(isCta).length;
  return cta === 0 || cta === value.length;
}

@ValidatorConstraint({ name: 'buttonsNotMixed', async: false })
export class ButtonsNotMixedConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return buttonsNotMixed(value);
  }
  defaultMessage(): string {
    return 'buttons must be all quick replies or all copy/link buttons — WhatsApp Web cannot load a message that mixes them';
  }
}
