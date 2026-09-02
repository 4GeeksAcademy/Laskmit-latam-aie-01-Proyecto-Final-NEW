# Evidencias de las pruebas efectuadas en auth-api

## Crear usuario nuevo (nótese que está pública - sin candado)

![alt text](image-2.png)

![Parámetros indicados](image-3.png)

![Respuesta](image-4.png)

## Login al usuario

![Parámetros indicados](image-5.png)

![Respuesta](image-6.png)

OK. Devolvió el token correctamente

## Autorización enviando el token

![Se introduce el token recibido en el login](image-7.png)

![OK fué autorizado]](image-8.png)

OK. Autorización correcta usando el token devuelto por el login


## Listar usuarios existentes 

![Lista los usuarios porque está autorizado ya](image-9.png)

OK. Lista correctamente los usuarios porque el token está correcto

## Listar Suppliers

![Lista los proveedores porque está autorizado ya](image-10.png)

OK. Lista los proveedores porque el token está correcto.
Ahora: Se hizo logout en Authorize para probar los que son sin token

## Se intenta listar usuarios existentes, ahora sin token porque hicimos logout

![Error: No autenticado](image-11.png)

ERROR:  Da error de autenticación porque no estamos autenticados


## Entré en Authorize pero le agregué unas xxxxx antes del token para enviar token malo

Luego tratando de listar nuevamente los proveedores

![Error porque el token estaba mal](image-12.png)

ERROR: Da error porque el token está mal formado (por las xxxxx)
