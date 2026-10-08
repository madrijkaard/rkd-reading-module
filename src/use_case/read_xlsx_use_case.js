export function readXlsxUseCase({ file, workerUrl, onProgress }) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') onProgress(data.value, data.text);
      if (data.type === 'complete') {
        worker.terminate();
        resolve(data.sheets);
      }
      if (data.type === 'error') {
        worker.terminate();
        reject(new Error(data.message));
      }
    };
    worker.onerror = (error) => {
      worker.terminate();
      reject(error.error || new Error('Falha ao processar a planilha.'));
    };
    file.arrayBuffer().then((buffer) => worker.postMessage({ buffer }, [buffer])).catch((error) => {
      worker.terminate();
      reject(error);
    });
  });
}
