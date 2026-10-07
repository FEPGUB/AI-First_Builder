# PRD-001: Orgenicemos — Aplicacion para la gestion de eventos

## Contexto y Problema

Se requiere una solución web/móvil para la gestión integral de eventos que automatice el envío de invitaciones, la confirmación de asistencia (RSVP) y el seguimiento posterior. La aplicación busca optimizar la comunicación entre organizadores e invitados mediante recordatorios automáticos y herramientas de retroalimentación (encuestas y observaciones).

Personas:

- Organizador de evento: Crea un evento con fecha, hora, ubicacion, descripcion, e invita a un grupo de personas.
- Invitado: Persona invitada a un evento. Puede responder la invitación (con o sin cuenta) y, si asiste, acceder al detalle e interacciones del evento.

## Objetivos

Poder generar eventos para distintas fechas, invitar gente.
Ademas, para cada evento poder agregar encuestas con información de la misma

## Requerimientos Funcionales

- RF-01: El sistema debe permitir que un usuario se registre e inicie sesión utilizando su correo electrónico y una contraseña.
- RF-02: El sistema debe permitir a invitados no autenticados confirmar o rechazar su asistencia mediante un enlace único de respuesta enviado a su correo electrónico.
- RF-03: Una persona autenticada (organizador) debe poder crear eventos definiendo: título, fecha, hora, ubicación (física o enlace virtual), descripción y lista de correos de invitados.
- RF-04: (Antelación de creación) El sistema solo debe permitir la creación de eventos con al menos 4 días de anticipación respecto a la fecha de realización.
- RF-05: Solo el organizador del evento tiene permisos para editar sus detalles o cancelarlo.
- RF-06: El sistema debe permitir a un usuario autenticado listar todos los eventos creados por él (como organizador) y los eventos a los que ha sido invitado.
- RF-07: Un evento y su información asociada solo deben ser visibles para el organizador y para las personas invitadas a dicho evento.
- RF-08: Al guardar o actualizar un evento, el sistema debe generar y enviar automáticamente las invitaciones individuales por correo electrónico con un enlace único de respuesta.
- RF-09: El invitado debe poder confirmar (Aceptado) o rechazar (Rechazado) la invitación únicamente hasta 24 hs antes a la fecha y hora del evento.
- RF-10: El organizador debe poder visualizar el resumen y listado de respuestas de los invitados, agrupados por estado: Aceptado, Rechazado y Pendiente.
- RF-11: El sistema debe ejecutar un proceso automático diario para evaluar la agenda de eventos y procesar los correos de recordatorio correspondientes.
- RF-12: Cuando falten 2 días para el evento, el sistema debe enviar un correo automático a los invitados en estado Pendiente recordando que confirmen su asistencia.
- RF-13: Cuando falte 1 día para el evento, el sistema debe enviar un correo automático a los invitados en estado Aceptado con el resumen de los datos del evento.
- RF-14: El organizador debe poder publicar "Observaciones" dentro de la ficha del evento.
- RF-15: El organizador debe poder crear encuestas vinculadas al evento.
- RF-16: Los invitados que hayan confirmado asistencia (Aceptado) deben poder ver la ficha completa del evento, leer las observaciones y responder las encuestas activas.
- RF-17: El completamiento de las encuestas por parte de los invitados debe ser opcional.
- RF-18: El organizador debe poder visualizar las respuestas y los resultados consolidados de las encuestas asociadas a su evento.

## Requerimientos No Funcionales

- RNF-01: Las contraseñas de los usuarios deben almacenarse de forma encriptada utilizando algoritmos de hash seguro.
- RNF-02: La sesión del usuario autenticado debe mantenerse activa de manera indefinida en el dispositivo hasta que el usuario ejecute explícitamente el cierre de sesión (logout).
- RNF-03: Los enlaces de invitación individual deben utilizar tokens únicos no predecibles para permitir la respuesta segura de invitados sin requerir inicio de sesión.
- RNF-04: El sistema debe garantizar que un usuario no pueda consultar datos de eventos a los que no pertenece ni como organizador ni como invitado.

## Criterios de Aceptación

- AC-01 (RF-03, RF-08, RF-09): Dado que el organizador ingresa la dirección de correo de un invitado y guarda el evento con al menos 4 días de anticipación, cuando el sistema procesa la solicitud, entonces envía un correo personalizado al invitado con los datos del evento y un enlace único que le permite marcar "Asistiré" o "No asistiré" sin necesidad de autenticarse, siempre que la fecha sea previa al día anterior del evento.
- AC-02 (RF-10): Dado que el organizador accede a la sección de "Invitados" en la gestión de su evento, cuando consulta la lista de convocados, entonces el sistema muestra un resumen cuantitativo y el listado de personas clasificadas en tres columnas o estados: Aceptado, Rechazado y Pendiente.
- AC-03 (RF-11, RF-12): Dado que faltan 2 días para la realización de un evento y existen invitados en estado Pendiente, cuando se ejecuta el proceso diario de notificaciones, entonces el sistema envía automáticamente un correo de recordatorio a dichos invitados solicitándoles confirmar su asistencia antes de que venza el plazo.
- AC-04 (RF-11, RF-13): Dado que falta 1 día para la realización de un evento, cuando se ejecuta el proceso diario de notificaciones, entonces el sistema envía un correo de recordatorio con los datos de fecha, hora y ubicación a todos los invitados en estado Aceptado.
- AC-05 (RF-15, RF-16, RF-17): Dado que el organizador añade una encuesta a su evento, cuando un invitado que marcó "Asistiré" (Aceptado) ingresa al detalle del evento, entonces visualiza las preguntas, puede responder de forma opcional y guardar sus elecciones.
- AC-07 (RF-14, RF-16): Dado que el organizador escribe un texto en el campo "Observaciones" y guarda los cambios, cuando cualquier invitado confirmado accede a la ficha del evento, entonces el texto se muestra publicado y resaltado en la sección informativa.

## Fuera de Alcance

No se implementará el modulo de envio de notificaciones Push

## Riesgos y Dependencias

- Riesgo: Baja entregabilidad de emails de invitación o recordatorios (los correos pueden ir a la carpeta de Spam). Mitigacion: Utilizar servidores de correo con alta tasa de entregabilidad (ej. SMTP2GO, Postmark y SendGrid) y tener bien configurados los registros SPF, DKIM y DMARC en tu dominio para demostrar que el correo es legítimo.
- Dependencia: Uso de SQLite como motor de base de datos.
