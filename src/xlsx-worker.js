import * as XLSX from '../node_modules/xlsx/xlsx.mjs';

self.onmessage = ({ data }) => {
  try {
    const workbook = XLSX.read(data.buffer, { type: 'array', cellDates: true });
    const sheetNames = workbook.SheetNames;
    const sheets = [];

    self.postMessage({ type: 'progress', value: 10, text: 'Lendo a estrutura da planilha…' });

    sheetNames.forEach((name, index) => {
      const worksheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
      sheets.push({
        name,
        rows,
        text: rows.map((row) => row.join(' ')).join('\n'),
      });
      const value = 10 + Math.round(((index + 1) / Math.max(sheetNames.length, 1)) * 85);
      self.postMessage({ type: 'progress', value, text: `Carregando aba ${index + 1} de ${sheetNames.length}…` });
    });

    self.postMessage({ type: 'complete', sheets });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || 'Não foi possível ler a planilha.' });
  }
};
