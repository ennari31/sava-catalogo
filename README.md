# sava-catalogo
Catálogo Mayorista de Sava, publicado con GitHub Pages (`index.html`).

## Estructura de carpetas

```
index.html                  catálogo (página única)
img/
  LISTA-FOTOS.md            nombre exacto de cada foto que hay que subir
  banners/                  portada, historia, una por categoría y las dos de cierre
  productos/
    sandalias/
    zapatos/
    botas/
    texanas/
    stilettos/
```

Las carpetas vacías tienen un archivo `.gitkeep` para que git las guarde; se puede borrar cuando la carpeta ya tenga fotos.

## Regla de nombres de las fotos

- Siempre en `.jpg`, en minúsculas, sin tildes ni espacios.
- Cualquier carácter que no sea letra o número se reemplaza por `-`, sin guiones repetidos ni al principio o al final.
  Ejemplo: "Sandalias Jazmín" + "Cuero Miel" → `sandalias-jazmin-cuero-miel`.
- **Productos:** `img/productos/<categoría>/<modelo>-<color>-1.jpg` es la foto principal.
  Las extras son opcionales: `-2.jpg` hasta `-6.jpg`, **consecutivas** (si falta la `-2`, la `-3` no se usa).
- **Banners** (`img/banners/`): `portada.jpg`, `historia.jpg`, `sandalias.jpg`, `zapatos.jpg`, `botas.jpg`,
  `texanas.jpg`, `stilettos.jpg`, `cierre-1.jpg`, `cierre-2.jpg`.

La lista completa, con un nombre de archivo por modelo y color, está en [img/LISTA-FOTOS.md](img/LISTA-FOTOS.md).

## Archivos privados

La planilla de productos (`catalogo_sava_productos.csv`) y el script de Google (`Codigo.gs`) **no se suben al repo**
(están en `.gitignore`). Se guardan solo en la computadora.
