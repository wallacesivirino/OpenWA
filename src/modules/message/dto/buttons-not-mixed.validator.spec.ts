import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SendButtonsDto } from './message-actions.dto';

const base = { chatId: '5511999999999@c.us', text: 'Pagar?' };

async function buttonsErrors(buttons: object[]): Promise<string[]> {
  const errors = await validate(plainToInstance(SendButtonsDto, { ...base, buttons }));
  return errors.filter(e => e.property === 'buttons').flatMap(e => Object.keys(e.constraints ?? {}));
}

describe('SendButtonsDto buttons kind', () => {
  it('accepts quick replies only', async () => {
    expect(await buttonsErrors([{ id: 'sim', text: 'Sim' }, { id: 'nao', text: 'Nao' }])).toEqual([]);
  });

  it('accepts copy + link only (the charge message)', async () => {
    expect(
      await buttonsErrors([
        { id: 'pix', text: 'Copiar chave', copyCode: 'chave' },
        { id: 'link', text: 'Pagar', url: 'https://example.com/p' },
      ]),
    ).toEqual([]);
  });

  // WhatsApp Web renders this mix as "Couldn't load message" while the phone renders it.
  it.each([
    [{ id: 'pix', text: 'Copiar', copyCode: 'chave' }],
    [{ id: 'link', text: 'Abrir', url: 'https://example.com' }],
  ])('refuses a quick reply mixed with %j', async cta => {
    expect(await buttonsErrors([{ id: 'sim', text: 'Sim' }, cta])).toContain('buttonsNotMixed');
  });
});
