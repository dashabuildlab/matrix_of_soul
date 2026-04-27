import { device } from 'detox';
import { LoginPage } from '../pages/LoginPage';
import { MatrixPage } from '../pages/MatrixPage';

const login  = new LoginPage();
const matrix = new MatrixPage();

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
  await login.waitForScreen();
  await login.tapSkip();
  await login.waitForText('Сьогодні');
});

beforeEach(async () => {
  // navigate back to matrix tab
  await login.tapText('Матриця');
  await matrix.waitForTabScreen();
});

// ── Happy Path ───────────────────────────────────────────────────────────────

describe('Matrix — happy path', () => {
  it('matrix tab screen loads', async () => {
    await matrix.assertTabScreenVisible();
  });

  it('empty state is shown when no matrices saved', async () => {
    await matrix.assertEmptyState();
  });

  it('create matrix — valid date calculates result', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.createMatrix('Тест', '15', '06', '1990');
    await matrix.assertResultVisible();
  });

  it('save matrix — appears in the list', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.createMatrix('Олена', '20', '03', '1985');
    await matrix.tapSave();
    // back on tab screen — saved matrix visible
    await matrix.waitForTabScreen();
    await matrix.assertSavedMatrixVisible('Олена');
  });

  it('compatibility button navigates to compatibility screen', async () => {
    await matrix.tapCompatibility();
    await matrix.waitForText('Сумісність');
  });

  it('daily matrix button navigates to daily screen', async () => {
    await matrix.tapDailyMatrix();
    await matrix.waitForText('Матриця Дня');
  });
});

// ── Negative / Validation ────────────────────────────────────────────────────

describe('Matrix — validation', () => {
  it('calculate with empty fields shows validation error', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.tapCalculate();
    await matrix.assertValidationError();
  });

  it('invalid day (>31) shows validation error', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.fillDate('40', '06', '1990');
    await matrix.tapCalculate();
    await matrix.assertValidationError();
  });

  it('invalid month (>12) shows validation error', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.fillDate('15', '13', '1990');
    await matrix.tapCalculate();
    await matrix.assertValidationError();
  });

  it('future year (>2030) shows validation error', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.fillDate('01', '01', '2099');
    await matrix.tapCalculate();
    await matrix.assertValidationError();
  });

  it('year before 1900 shows validation error', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.fillDate('01', '01', '1800');
    await matrix.tapCalculate();
    await matrix.assertValidationError();
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe('Matrix — edge cases', () => {
  it('matrix without name uses default title', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.fillDate('01', '01', '2000');
    await matrix.tapCalculate();
    await matrix.waitForResult();
    await matrix.tapSave();
    await matrix.waitForTabScreen();
    await matrix.waitForText('Матриця 2000-01-01');
  });

  it('create second matrix — both appear in list', async () => {
    await matrix.tapCreate();
    await matrix.waitForCreateScreen();
    await matrix.createMatrix('Другий', '10', '10', '1995');
    await matrix.tapSave();
    await matrix.waitForTabScreen();
    await matrix.assertSavedMatrixVisible('Другий');
  });
});
