import { ValidationPipe } from '@nestjs/common';
import { GLOBAL_VALIDATION_OPTIONS } from '../../../config/app-validation';
import { COPY_CODE_MAX_LENGTH, SendButtonsDto } from './message-actions.dto';

// The production pipe, so forbidNonWhitelisted is exercised exactly as a request meets it.
const pipe = new ValidationPipe(GLOBAL_VALIDATION_OPTIONS);
const base = { chatId: '5511999999999@c.us', text: 'Pagar?' };

async function messages(buttons: object[]): Promise<string[]> {
  try {
    await pipe.transform({ ...base, buttons }, { type: 'body', metatype: SendButtonsDto });
    return [];
  } catch (err) {
    return (err as { getResponse(): { message: string[] } }).getResponse().message;
  }
}

describe('SendButtonDto copy code and type', () => {
  it('accepts a Pix copy code longer than 200 characters', async () => {
    expect(await messages([{ id: 'pix', text: 'Copiar Pix', copyCode: 'P'.repeat(205) }])).toEqual([]);
  });

  it('accepts a copy code at the 512 cap and refuses one past it', async () => {
    expect(COPY_CODE_MAX_LENGTH).toBe(512);
    expect(await messages([{ id: 'pix', text: 'Copiar Pix', copyCode: 'P'.repeat(512) }])).toEqual([]);
    expect(await messages([{ id: 'pix', text: 'Copiar Pix', copyCode: 'P'.repeat(513) }])).toEqual([
      'buttons.0.copyCode must be shorter than or equal to 512 characters',
    ]);
  });

  // Atrion's charge message sends an explicit type on every button.
  it('accepts an explicit type matching the button kind', async () => {
    expect(
      await messages([
        { id: 'pix', text: 'Copiar Pix', type: 'copy', copyCode: 'P'.repeat(300) },
        { id: 'link', text: 'Pagar', type: 'url', url: 'https://example.com/p' },
      ]),
    ).toEqual([]);
    expect(await messages([{ id: 'sim', text: 'Sim', type: 'reply' }])).toEqual([]);
  });

  it('refuses an unknown type', async () => {
    expect(await messages([{ id: 'x', text: 'X', type: 'call' }])).toEqual([
      expect.stringContaining('buttons.0.type must be one of'),
    ]);
  });

  it.each([
    ['copy', 'copyCode'],
    ['url', 'url'],
  ])('refuses type %s without its %s', async (type, field) => {
    const errors = await messages([{ id: 'x', text: 'X', type }]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every(m => m.startsWith(`buttons.0.${field} `))).toBe(true);
  });
});
