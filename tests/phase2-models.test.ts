import { describe, expect, it } from 'vitest';
import { Message } from '../src/models/Message.js';
import { Feedback } from '../src/models/Feedback.js';
import { Notification } from '../src/models/Notification.js';

describe('Phase 2 model validation', () => {
  it('rejects empty messages and messages longer than the allowed length', async () => {
    const empty = new Message({ conversation: '68c123456789abcdef123456', sender: '68c123456789abcdef123457', content: ' ' });
    await expect(empty.validate()).rejects.toThrow();
    const tooLong = new Message({ conversation: '68c123456789abcdef123456', sender: '68c123456789abcdef123457', content: 'x'.repeat(4001) });
    await expect(tooLong.validate()).rejects.toThrow();
  });

  it('only accepts feedback ratings from 1 through 5', async () => {
    const feedback = new Feedback({ appointment: '68c123456789abcdef123456', mentor: '68c123456789abcdef123457', mentee: '68c123456789abcdef123458', rating: 6 });
    await expect(feedback.validate()).rejects.toThrow();
  });

  it('restricts notifications to the required event types', async () => {
    const notification = new Notification({ recipient: '68c123456789abcdef123456', type: 'UNKNOWN_EVENT', message: 'Test' });
    await expect(notification.validate()).rejects.toThrow();
  });
});
