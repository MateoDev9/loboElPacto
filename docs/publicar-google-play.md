# Publicar Wolves en Google Play

Guía de los pasos que hay que hacer a mano, en orden. Algunos tardan días en aprobarse, así que conviene empezar ya por el 1.

## 1. Cuenta de desarrollador de Google Play
1. Entra en <https://play.google.com/console/signup> con la cuenta de Google que quieras usar para la app.
2. Elige **cuenta personal** (o de organización si tienes empresa).
3. Paga la cuota única de **25 $** y verifica tu identidad con el documento que te pidan. La verificación puede tardar unos días.
4. **Importante para cuentas personales nuevas:** antes de publicar en producción, Google exige una **prueba cerrada con al menos 12 personas durante 14 días seguidos**. Ve pensando en 12 amigos con Android y cuenta de Google. Las pruebas internas (paso 5) no cuentan para esto.
5. En **Configuración › Perfil de pagos**, crea el perfil de comerciante. Sin él no se pueden vender productos en la app.

## 2. Herramientas en el ordenador
1. Instala Android Studio (incluye el JDK que hace falta):
   ```bash
   winget install --id Google.AndroidStudio -e
   ```
2. Ábrelo una vez y deja que descargue el SDK de Android (asistente inicial, opciones por defecto).
3. Instala el JDK 21 para compilar. El JDK 25 que trae Android Studio es demasiado nuevo para el Gradle 8.14 del proyecto:
   ```bash
   winget install --id Microsoft.OpenJDK.21 -e --source winget
   ```
4. En Android Studio, en **Settings › Build, Execution, Deployment › Build Tools › Gradle › Gradle JDK**, elige el JDK 21.

## 3. Clave de firma (la guardas tú, nunca en git)
1. Crea la clave de subida (te pedirá dos contraseñas y tus datos; apúntalas en tu gestor de contraseñas):
   ```bash
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v -keystore "%USERPROFILE%\wolves-upload.jks" -alias wolves -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Crea el archivo `android/keystore.properties` (ya está en `.gitignore`) con este contenido, cambiando las contraseñas:
   ```properties
   storeFile=C:/Users/Mateo/wolves-upload.jks
   storePassword=LA_CONTRASEÑA_DEL_ALMACÉN
   keyAlias=wolves
   keyPassword=LA_CONTRASEÑA_DE_LA_CLAVE
   ```
3. Haz una copia de seguridad del archivo `.jks` fuera del ordenador. Con la firma de apps de Google Play, si lo pierdes se puede pedir otra clave de subida, pero es un trámite.

## 4. Compilar el paquete para Google Play
Desde la carpeta del proyecto:
```bash
npm run build:android
```
```bash
cd android && gradlew.bat bundleRelease
```
Si lo compilas desde la terminal en vez de desde Android Studio, `JAVA_HOME` tiene que apuntar al JDK 21: `C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot`.
El archivo queda en `android/app/build/outputs/bundle/release/app-release.aab`. En cada versión nueva hay que subir `versionCode` en `android/app/build.gradle`.

## 5. Crear la app en Play Console y subir una primera versión
1. **Crear aplicación:** nombre «Wolves: El pueblo duerme», idioma español (España), tipo **Juego**, **Gratuita** (el Grimorio es una compra dentro de la app).
2. **Probar y publicar › Pruebas › Prueba interna:** crea una versión, acepta la **firma de aplicaciones de Google Play** y sube el `.aab`. Esto hace falta antes de poder crear el producto de pago, porque Google necesita ver el permiso de facturación que añade RevenueCat.
3. Añade tu correo como probador de la prueba interna y abre el enlace de participación desde el móvil.

## 6. Producto de pago único
1. **Monetizar › Productos › Productos de la aplicación › Crear producto.**
2. ID: `grimorio_completo_pro` (exactamente así; el ID no se puede cambiar después).
3. Nombre: «Grimorio Completo». Descripción: «Desbloquea los 24 personajes especiales y la expansión de edificios para siempre».
4. Precio: **3,99 €** (Google lo convierte para los demás países). Actívalo.

## 7. RevenueCat
1. Crea una cuenta en <https://app.revenuecat.com> y un proyecto «Wolves».
2. **Añade una app de Google Play** con el nombre de paquete `com.mateodev.wolves`.
3. **Credenciales de Google Play** (para que RevenueCat valide las compras con Google). Sigue la guía de RevenueCat «Google Play Store service credentials»; en resumen:
   - En Google Cloud, en un proyecto nuevo, activa **Google Play Android Developer API** y **Google Play Developer Reporting API**.
   - Crea una **cuenta de servicio**, descarga su **clave JSON**.
   - En Play Console › **Usuarios y permisos**, invita el correo de esa cuenta de servicio con permisos para ver información de la app y datos financieros, y gestionar pedidos.
   - Sube el JSON en RevenueCat. Los permisos pueden tardar hasta 36 horas en funcionar.
4. **Productos:** importa `grimorio_completo_pro`.
5. **Derechos de uso (Entitlements):** crea `pro` y asóciale ese producto.
6. **Ofertas (Offerings):** crea `default`, márcala como actual y añade un paquete de tipo **Lifetime** con `grimorio_completo_pro`.
7. **Claves de API:** copia la **clave pública del SDK de Android** (empieza por `goog_`). Es pública por diseño.
8. En el proyecto, copia `.env.example` a `.env` y pega la clave en `VITE_REVENUECAT_ANDROID_KEY`. Vuelve a compilar (paso 4), sube `versionCode` y sube el nuevo `.aab` a la prueba interna.

## 8. Probar la compra sin pagar
1. Play Console › **Configuración › Pruebas de licencias:** añade tu Gmail.
2. Instala la app desde el enlace de la prueba interna (no desde Android Studio, para que la compra pase por Google Play).
3. Compra el Grimorio: aparecerá una tarjeta de prueba («Tarjeta de prueba, se aprueba siempre»). Comprueba:
   - se desbloquean los 24 personajes y los edificios;
   - cerrando la app y abriéndola sin conexión, el PRO sigue activo;
   - desinstalando, reinstalando y pulsando «Restaurar compra», vuelve;
   - en RevenueCat aparece la compra.

## 9. Ficha de la tienda
Archivos listos en `docs/google-play/` y `public/`:
- **Icono** 512 × 512: `public/icon-512.png`.
- **Gráfico destacado** 1024 × 500: `docs/google-play/grafico-destacado.png`.
- **Capturas de móvil:** hacen falta al menos 2 (mejor 4-6). Lo más fácil es hacerlas en tu móvil con la app de la prueba interna: portada, preparación del mazo, una llamada de la noche y el amanecer.

**Nombre (máx. 30):**
> Wolves: El pueblo duerme

**Descripción breve (máx. 80):**
> Narra tus partidas de hombres lobo: orden de llamada, reglas y votaciones.

**Descripción completa:**
> Wolves es el asistente del narrador para partidas de hombres lobo con cartas físicas. Cada jugador recibe su carta de verdad y la app te guía durante toda la partida:
>
> • Prepara el mazo recomendado según cuántos jugáis, o ajústalo a tu gusto.
> • Ubica quién tiene cada carta conforme los personajes abren los ojos la primera noche.
> • Llama a cada personaje en su orden, con el texto que tienes que decir en voz alta.
> • Resuelve ataques, pociones, protecciones, enamorados y votaciones sin consultar el reglamento.
> • Coro con el orden real de la mesa, deshacer paso a paso y temporizador de debate.
> • Funciona sin conexión y no necesita registro: todo se guarda en tu móvil.
>
> Gratis con los 7 personajes clásicos. El Grimorio Completo, de pago único, añade 24 personajes especiales y la expansión de edificios de la aldea, para siempre y para toda la mesa.

**Otros apartados de Play Console:**
- **Política de privacidad:** `https://mateodev9.github.io/wolves/privacidad.html` (la versión nueva estará publicada cuando hagas push).
- **Anuncios:** no contiene anuncios.
- **Público objetivo:** mayores de 13 años (así no aplica la política de familias).
- **Clasificación de contenido:** rellena el cuestionario con sinceridad (juego de deducción con muertes narradas en texto, sin violencia gráfica ni compras con dinero real de azar).
- **Seguridad de los datos:** declara lo que recoge RevenueCat (identificador anónimo e historial de compras, cifrado en tránsito, para la funcionalidad de la app). RevenueCat tiene una guía específica «Google Play Data Safety»; síguela para marcar las casillas exactas.

## 10. Antes de pasar a producción
- Revisa el riesgo de propiedad intelectual: los nombres de personajes originales del juego, los textos de reglas y varias cartas que repiten las composiciones oficiales. Google retira apps que infringen derechos de terceros.
- Completa la prueba cerrada de 12 personas durante 14 días (paso 1.4) y solicita el acceso a producción.
