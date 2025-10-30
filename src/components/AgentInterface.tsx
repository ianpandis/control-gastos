import { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { runAgent } from '../services/openai';
import './AgentInterface.css';

export default function AgentInterface() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState<{
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else {
      setError('Por favor, selecciona un archivo PDF válido');
      setPdfFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!systemPrompt.trim()) {
      setError('Por favor, ingresa un system prompt');
      return;
    }

    if (!pdfFile) {
      setError('Por favor, selecciona un archivo PDF');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');
    setUsage(null);

    try {
      // Extraer texto del PDF
      const pdfContent = await extractTextFromPDF(pdfFile);

      // Ejecutar el agente
      const result = await runAgent({
        systemPrompt,
        pdfContent,
        userMessage: userMessage.trim() || undefined,
      });

      setResponse(result.content);
      setUsage(result.usage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error desconocido'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSystemPrompt('');
    setPdfFile(null);
    setUserMessage('');
    setResponse('');
    setError('');
    setUsage(null);
  };

  return (
    <div className="agent-interface">
      <h1>Agente OpenAI - Análisis de PDF</h1>

      <form onSubmit={handleSubmit} className="agent-form">
        <div className="form-group">
          <label htmlFor="systemPrompt">System Prompt:</label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Ej: Eres un asistente experto en análisis de gastos. Analiza el resumen de tarjeta y proporciona insights útiles..."
            rows={5}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pdfFile">Archivo PDF:</label>
          <input
            type="file"
            id="pdfFile"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
          {pdfFile && (
            <p className="file-info">Archivo seleccionado: {pdfFile.name}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="userMessage">
            Mensaje adicional (opcional):
          </label>
          <textarea
            id="userMessage"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Ej: ¿Cuáles son mis gastos más altos?"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button type="submit" disabled={loading || !pdfFile || !systemPrompt}>
            {loading ? 'Procesando...' : 'Analizar PDF'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="reset-button"
          >
            Limpiar
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {response && (
        <div className="response-section">
          <h2>Respuesta del Agente:</h2>
          <div className="response-content">{response}</div>
          {usage && (
            <div className="usage-info">
              <h3>Uso de tokens:</h3>
              <p>Prompt: {usage.prompt_tokens}</p>
              <p>Completion: {usage.completion_tokens}</p>
              <p>Total: {usage.total_tokens}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
