# RutaSalud

Prototipo funcional (TRL 5) de una interfaz web para consultar y hacer seguimiento a las autorizaciones de citas con especialistas y de medicamentos en las EPS de Colombia.

Proyecto de grado de Ingeniería de Sistemas, Universidad Nacional Abierta y a Distancia (UNAD).
Autor: Luis Guillermo Silva Parrado.

## Qué hace

- Ingreso con validación de campos y configuración inicial (tamaño de letra, canal de avisos, contraste).
- Panel principal con el resumen de autorizaciones activas y alertas de plazos vencidos.
- Detalle de cada autorización con línea de tiempo, número copiable, datos de la cita y la orden médica.
- Seguimiento de medicamentos con entregas incompletas y plazo de 48 horas para lo pendiente.
- Centro de avisos con conteo de no leídos.
- Historial con búsqueda y filtros.
- Perfil con personas a cargo y acompañantes autorizados.
- Ajustes de accesibilidad: letra grande, alto contraste y reducción de animaciones.
- Ayuda con requisitos, pasos para presentar un reclamo y glosario.
- Modo demostración para simular la respuesta de la EPS.

## Cómo ejecutarlo

No requiere instalación. Abra `index.html` en el navegador o publique la carpeta en GitHub Pages.

Para probarlo en local con un servidor:

```
python -m http.server 8000
```

y abra `http://localhost:8000`.

Datos de prueba: documento `1000000001`, contraseña `demo2026`.

## Estructura

```
index.html        Estructura base, menú y contenedores
css/styles.css    Estilos, variables de diseño y ajustes de accesibilidad
js/data.js        Datos ficticios de demostración
js/store.js       Estado, almacenamiento local y reglas de plazos
js/views.js       Plantillas de cada pantalla
js/app.js         Enrutador, validaciones y eventos
```

## Aviso

Todos los nombres, documentos, EPS, IPS y direcciones son ficticios. El prototipo no se conecta con ningún sistema real y no debe usarse con datos personales verdaderos.
