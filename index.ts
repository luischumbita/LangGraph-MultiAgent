import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
import { llm } from './llm';

// Define the state interface to match what the LLM returns
interface IState {
  messages: Array<{ role: string; content: string }>;
}

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint para invocar el flujo
app.post('/invoke', async (req: express.Request, res: express.Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Debes enviar un array 'messages'" });
    }

    // Invocamos el workflow
    const result = await llm.invoke({ messages }) as unknown as IState;

    // Opcional: puedes devolver también todos los logs intermedios
    res.json({
      finalMessage: result.messages[result.messages.length - 1].content,
      fullFlow: result.messages.map((m: { role: string; content: string }) => m.content)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al ejecutar el flujo" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server corriendo en http://localhost:${PORT}/api-docs`);
});
