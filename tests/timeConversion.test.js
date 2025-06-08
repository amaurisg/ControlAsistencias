const { convertirHoraA24, convertirHoraA12 } = require('../js/timeUtils');

describe('convertirHoraA24', () => {
  test('convierte 1:05 PM a 13:05', () => {
    expect(convertirHoraA24('1:05 PM')).toBe('13:05');
  });

  test('convierte 12:00 AM a 00:00', () => {
    expect(convertirHoraA24('12:00 AM')).toBe('00:00');
  });

  test('retorna null si no hay entrada', () => {
    expect(convertirHoraA24('')).toBeNull();
  });
});

describe('convertirHoraA12', () => {
  test('convierte 13:05 a 1:05 PM', () => {
    expect(convertirHoraA12('13:05')).toBe('1:05 PM');
  });

  test('convierte 00:00 a 12:00 AM', () => {
    expect(convertirHoraA12('00:00')).toBe('12:00 AM');
  });

  test('retorna "-" si no hay entrada', () => {
    expect(convertirHoraA12('')).toBe('-');
  });
});
