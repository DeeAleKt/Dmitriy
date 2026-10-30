import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildXlsx, STYLE } from '../src/xlsx.js';

test('xlsx — коректний ZIP з потрібними частинами і кирилицею', () => {
  const bytes = buildXlsx([
    { name: 'Записи', widths: [12, 30], rows: [['Дата', 'Працівник', '%'], ['30.10.2026', 'Іван <&> "Петренко"', { v: 61.538, s: STYLE.decimal }]] },
    { name: 'Підсумок/звіт*', rows: [['A'], [1]] },
  ]);
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  const dir = mkdtempSync(join(tmpdir(), 'xlsx-'));
  const file = join(dir, 't.xlsx');
  writeFileSync(file, bytes);
  const list = execFileSync('unzip', ['-l', file]).toString();
  for (const part of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/styles.xml']) {
    assert.ok(list.includes(part), part);
  }
  assert.match(execFileSync('unzip', ['-t', file]).toString(), /No errors detected/);
  const sheet = execFileSync('unzip', ['-p', file, 'xl/worksheets/sheet1.xml']).toString();
  assert.ok(sheet.includes('Іван &lt;&amp;&gt; &quot;Петренко&quot;'));
  assert.ok(sheet.includes('<v>61.538</v>'));
  const wb = execFileSync('unzip', ['-p', file, 'xl/workbook.xml']).toString();
  assert.ok(wb.includes('name="Підсумок звіт"'));
});
