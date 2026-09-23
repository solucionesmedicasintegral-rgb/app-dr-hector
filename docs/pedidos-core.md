# Contrato para pedidos persistentes

El export revisado de `HECTOR - Nimbo Core v3 - APP` no trae rutas de pedidos. Crear una Data Table `pedidos_hector` con estos campos antes de habilitar Admin > Pedidos:

| Columna | Tipo |
| --- | --- |
| pedido_id | String |
| paciente_id | String |
| paciente_nombre | String |
| telefono | String |
| items_json | String |
| subtotal | Number |
| tipo_entrega | String |
| costo_envio | Number |
| total | Number |
| direccion_entrega | String |
| estado_pedido | String |
| estado_pago | String |
| metodo_pago | String |
| monto_pagado | Number |
| rastreo_url | String |
| fecha_registro | Date |
| fecha_actualizacion | Date |

`items_json` contiene un arreglo JSON serializado con `producto_id`, `nombre`, `cantidad` y `precio_unitario`. Al responder a `listar_pedidos`, Core puede devolverlo como `items` (arreglo o cadena JSON); la app maneja ambas representaciones.

## Rutas de Core

- `crear_pedido`: verificar PIN del administrador **en el servidor**, `pedido_id` único, paciente y productos activos de Nimbo. Recalcular `subtotal` con precios de Nimbo, `costo_envio = 250` si `tipo_entrega = domicilio`, de otro modo `0`; recalcular `total`. Persistir estado inicial `solicitado` y pago `pendiente`. Responder `{ok:true,pedido_id}` solo después del guardado.
- `listar_pedidos`: verificar PIN; devolver `{ok:true,pedidos:[...]}` desde la tabla.
- `actualizar_pedido`: verificar PIN; buscar por `pedido_id`; permitir `solicitado → recibido_consultorio → enviado → entregado` para domicilio, o `solicitado → recibido_consultorio → entregado` para recoger. Exigir un enlace HTTPS de seguimiento al enviar a domicilio. Permitir pago `pendiente → pagado` tras comprobación manual, guardar método y monto. Responder `{ok:true,pedido_id}` solo después de persistir.

El navegador manda propuestas, no determina precios, costo de envío, permisos ni transiciones. El estado de pago se guarda separado del estado de entrega. El enlace de rastreo se comparte a la paciente por WhatsApp mediante acción manual del Admin. No se manda información médica por el enlace.