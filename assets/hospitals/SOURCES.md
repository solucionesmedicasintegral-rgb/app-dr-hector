# Hospital logos

Public official logo sources, retrieved 2026-10-23. Converted to PNG with original proportions and colors for Google Docs compatibility. Logos identify alternatives; they do not imply a partnership or confirmed hospital pricing.

- angeles: https://hospitalangeles.com/assets/img/hospital-angeles-horizontal.webp
- real-san-jose: https://hrsj.com.mx/wp-content/uploads/logo.jpg
- lomas-providencia: https://www.lomasprovidencia.com/wp-content/uploads/2022/03/cropped-imagotipo-LOMAS.png
- versalles: https://www.hospitalversalles.com.mx/wp-content/uploads/2022/01/logo.svg
- country-2000: https://hospitalcountry.com.mx/images/hc_logo_2.svg

# Quotation flow

Copiar Plantilla Cotizacion -> authenticated Google Docs GET (Leer Documento Cotizacion) -> Code (n8n/format-hospital-appendix.js) -> batchUpdate using the returned requests. The preparer produces replacements only. Document indexes are read dynamically and styles are applied before replacements. New logos can be registered in the formatter's allowlist. Unregistered hospital names render normally without a logo.
