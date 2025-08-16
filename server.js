const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const { app: workflowApp } = require('./index'); // Importa tu workflow compilado

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint para invocar el flujo
app.post('/invoke', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Debes enviar un array 'messages'" });
    }

    // Invocamos el workflow
    const result = await workflowApp.invoke({ messages });

    // Opcional: puedes devolver también todos los logs intermedios
    res.json({
      finalMessage: result.messages[result.messages.length - 1].content,
      fullFlow: result.messages.map(m => m.content)
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
