// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

// Importa los módulos necesarios
const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors'); // Para permitir peticiones desde tu frontend

// Crea una instancia de la aplicación Express
const app = express();
const port = process.env.PORT || 3000; // Define el puerto del servidor, usa 3000 por defecto

// Middlewares
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Permite que Express parse el cuerpo de las solicitudes como JSON

// Configuración de la conexión a Neo4j
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'; // URI de tu instancia de Neo4j
const user = process.env.NEO4J_USER || 'neo4j'; // Usuario de tu base de datos Neo4j
const password = process.env.NEO4J_PASSWORD || 'neo4j'; // Contraseña de tu base de datos Neo4j

// Crea el driver de Neo4j para la conexión
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Verifica la conexión a la base de datos al iniciar el servidor
driver.verifyConnectivity()
  .then(() => {
    console.log('¡Conexión exitosa a Neo4j!');
  })
  .catch((error) => {
    console.error('Error al conectar a Neo4j:', error);
    process.exit(1); // Sale de la aplicación si no puede conectar a la DB
  });

// --- Rutas de la API ---

// Ruta para obtener todas las Zonas y Centros de Distribución
app.get('/api/lugares', async (req, res) => {
  const session = driver.session(); // Abre una nueva sesión
  try {
    const result = await session.run(`
      MATCH (n:Zona) RETURN n.nombre AS nombre, labels(n)[0] AS tipo
      UNION
      MATCH (n:CentroDistribucion) RETURN n.nombre AS nombre, labels(n)[0] AS tipo
      ORDER BY nombre
    `);
    const lugares = result.records.map(record => ({
      nombre: record.get('nombre'),
      tipo: record.get('tipo')
    }));
    res.json(lugares);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener lugares.' });
  } finally {
    await session.close(); // Cierra la sesión
  }
});


// Ruta para calcular la ruta más rápida entre dos puntos
app.post('/api/ruta-mas-rapida', async (req, res) => {
  const { origen, destino } = req.body; // Obtiene el origen y destino del cuerpo de la solicitud

  if (!origen || !destino) {
    return res.status(400).json({ error: 'Por favor, proporciona un origen y un destino.' });
  }

  const session = driver.session(); // Abre una nueva sesión para la consulta
  try {
    // Primero, encontramos los IDs de los nodos de origen y destino
    const getNodesResult = await session.run(`
      MATCH (n) WHERE n.nombre = $origen OR n.nombre = $destino
      RETURN n.nombre AS nombre, id(n) AS nodeId, labels(n)[0] AS label
    `, { origen, destino });

    const nodesMap = {};
    getNodesResult.records.forEach(record => {
      nodesMap[record.get('nombre')] = {
        nodeId: record.get('nodeId'),
        label: record.get('label')
      };
    });

    const sourceNodeId = nodesMap[origen]?.nodeId;
    const targetNodeId = nodesMap[destino]?.nodeId;

    if (!sourceNodeId || !targetNodeId) {
      return res.status(404).json({ error: 'Uno o ambos lugares (origen/destino) no se encontraron en la base de datos.' });
    }

    // Ejecuta la consulta de Dijkstra usando el grafo proyectado 'myGraph'
    const result = await session.run(`
      MATCH (source) WHERE id(source) = $sourceNodeId
      MATCH (target) WHERE id(target) = $targetNodeId
      CALL gds.shortestPath.dijkstra.stream('myGraph', {
          sourceNode: source,
          targetNode: target,
          relationshipWeightProperty: 'tiempo_minutos'
      })
      YIELD index, sourceNode, targetNode, totalCost, nodeIds, path
      RETURN
          gds.util.asNode(sourceNode).nombre AS Origen,
          gds.util.asNode(targetNode).nombre AS Destino,
          totalCost AS TiempoTotalMinutos,
          [nodeId IN nodeIds | gds.util.asNode(nodeId).nombre] AS RutaCompleta
    `, { sourceNodeId: sourceNodeId, targetNodeId: targetNodeId });

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'No se encontró una ruta entre el origen y el destino especificados.' });
    }

    const ruta = result.records[0];
    res.json({
      origen: ruta.get('Origen'),
      destino: ruta.get('Destino'),
      tiempoTotalMinutos: ruta.get('TiempoTotalMinutos'),
      rutaCompleta: ruta.get('RutaCompleta')
    });

  } catch (error) {
    console.error('Error al calcular la ruta más rápida:', error);
    // Errores específicos de GDS
    if (error.code === 'Neo.ClientError.Procedure.ProcedureNotFound') {
        res.status(500).json({ error: 'El procedimiento gds.shortestPath.dijkstra.stream no fue encontrado. ¿Está el plugin GDS instalado y el grafo "myGraph" proyectado correctamente?' });
    } else {
        res.status(500).json({ error: 'Error interno del servidor al calcular la ruta.' });
    }
  } finally {
    await session.close(); // Cierra la sesión
  }
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor de backend escuchando en http://localhost:${port}`);
});

// Manejo de cierre de la aplicación
process.on('SIGINT', async () => {
  console.log('Cerrando conexión a Neo4j y saliendo...');
  await driver.close();
  process.exit(0);
});