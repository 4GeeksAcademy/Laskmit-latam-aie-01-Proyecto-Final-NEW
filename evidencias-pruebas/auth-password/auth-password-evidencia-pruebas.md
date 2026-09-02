# Evidencias de pruebas manuales - Auth Restablecimiento de Password

Rama: `auth-password`

## Objetivo

Demostrar el funcionamiento de AUTH-Restablecimiento de password

- Solicitud de recuperacion de contrasena sin revelar si un usuario existe.
- Restablecimiento mediante un enlace enviado por Resend.
- Cambio de contrasena desde una sesion autenticada.
- Conservacion de las funciones existentes de autenticacion y del backoffice.

# EVIDENCIA DE LAS PRUEBAS

## Prueba 1 - Enlace de recuperacion en formulario de LOGIN - Procesar Olvidé mi contraseña

Al abrir la aplicación, aparece la página de LOGIN.  Se presiona en el enlace **¿Olvidaste tu contrasena?**.
![alt Se da click a contraseña olvidada](image.png)

Se confirmar que abre `/forgot-password` sin exigir autenticacion.
![alt recuperar contraseña](image-1.png)

Se introduce el correo y se envia la solicitud para que mande el correo
![alt correo enviado al usuario](image-2.png)

Correos que han sido enviados por el RESEND:
![alt último correo es el de esta prueba](image-13.png)

Correo recibido por el usuario:
![alt Correo recibido](image-3.png)

Al abrir el correo se aprecia el enlace:
![alt correo recibido para clickar en el enlace](image-4.png)

El enlace lleva a la definición de la nueva cotraseña:
![alt Introducir nueva contraseña](image-5.png)

Actualizar contraseña:
![alt actualizar la contraseña](image-6.png)

Contraseña correctamente actualizada, permite iniciar sesión
![alt listo para iniciar sesión](image-7.png)

Al dar LOGIN, entra en la parte protegida
![alt dentro del backoffice autenticada](image-8.png)


## Prueba 2 - Validacion local del email

En recuperar contraseña, colocamos un correo incorrecto:
![alt correo incorrecto introducido](image-9.png)

Se envia la solicitud pero la aplicación no dice que el correo está incorrecto. Solo indica con un mensaje que si el correo existe, se enviará el correo
![alt se enviará correo si existe pero no da error](image-10.png)

En caso de que se deje en blanco el correo, la aplicación si devuelve un error
![alt error por correo vacio](image-11.png)

Enviando un texto que no es un correo
![alt no se envia porque correo es un texto cualquiera](image-12.png)


## Prueba 3 - Proteccion contra enumeracion de usuarios

Se introduce un email correcto pero es un usuario que no está creado en la aplicación
La aplicación responde igual que antes, para que no se sepa que el usuario no existe
![alt respuesta igual que siempre para evitar enumeración](image-14.png)

Nota: Resend no envió ningun correo


## Prueba 4 - Usuario activo quiere cambiar su contrasena

Recargué la página. Se ve que en network llamó a ME para verificar usuario activo.
![alt aparecen llamada a ME](image-15.png)

Usuario presiona botón de Contraseña para cambiarla
![alt botón contraseña](image-16.png)

Se carga formulario para introducir contraseña
![alt indicar la contraseña dos veces](image-17.png)

Se introducen contraseñas diferentes en el formulario:
![alt se muestra mensaje de error por contraseñas diferentes](image-18.png)

Se introducen contraseñas de menos de 8 caracteres
![alt mensaje de error por contraseña muy corta](image-19.png)

Se introduce la contraseña actual incorrecta
![alt error por contraseña actual](image-20.png)

Todos los datos correctos:
![alt actualiza la contraseña de forma correcta](image-21.png)

## Prueba 5 - Usuario activo - tiene token y se esconde por sensible

Se muestra usuario activo en uno de los formularios con token activo
![alt usuario activo - token tapado](image-22.png)

## Prueba 6 - Usuario quiere entrar con clave incorrecta

Se le emite el mensaje de error (usuario o clave incorrectos)
![alt error mostrado](image-23.png)

