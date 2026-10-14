# Acceso a expedientes existentes

La app no crea expedientes. Si el teléfono no coincide con ninguno, muestra un aviso y contacto al consultorio. Nimbo debe contener el mismo teléfono en cada expediente de la madre y sus hijas para mostrar las opciones. No se infiere parentesco por apellido.

Al elegir otro expediente, se limpian citas, pedidos, reserva y acceso a indicaciones de la sesión previa. Los correos y códigos clínicos se validan contra el ID elegido dentro de las coincidencias de teléfono; las indicaciones mantienen la verificación por correo del expediente.

Nodos publicados: Core `Procesar Paciente` (coincidencia exacta y lista de opciones), Core `Preparar Paciente Nimbo` (registro bloqueado), Indicaciones `Verificar expediente` y Avisos `Preparar correo` (selección por ID).

Validación local: número inexistente, selección de hija, limpieza de sesión, exclusión de teléfonos diferentes y duplicados. No se crean pacientes ni citas durante la validación.
