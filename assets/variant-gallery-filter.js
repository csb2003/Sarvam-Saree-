(function () {
  function filterGalleryByColor(colorValue) {
    if (!colorValue) return;

    const color = colorValue.toLowerCase().trim();

    // Target all media slides in the gallery
    const mediaItems = document.querySelectorAll(
      '.product__media-item, .slider__slide, [data-media-id]'
    );

    let firstVisible = null;

    mediaItems.forEach(function (item) {
      const img = item.querySelector('img');
      if (!img) return;

      const alt = (img.alt || '').toLowerCase().trim();

      if (alt.includes(color)) {
        item.classList.remove('hidden');
        item.style.display = '';
        if (!firstVisible) firstVisible = item;
      } else {
        item.classList.add('hidden');
        item.style.display = 'none';
      }
    });

    // Scroll gallery to first matching image
    if (firstVisible) {
      firstVisible.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }

  function getSelectedColor() {
    // Try radio inputs first (swatch style)
    const checkedRadio = document.querySelector(
      '.variant-input-wrap input[type="radio"]:checked, input[name="Color"]:checked'
    );
    if (checkedRadio) return checkedRadio.value;

    // Try select dropdown
    const select = document.querySelector(
      'select[name="Color"], select#Color, variant-selects select'
    );
    if (select) return select.value;

    return null;
  }

  function init() {
    // Filter on page load with default selected color
    const initialColor = getSelectedColor();
    if (initialColor) filterGalleryByColor(initialColor);

    // Watch for any input change inside the variant picker
    const variantPicker = document.querySelector('variant-radios, variant-selects');
    if (variantPicker) {
      variantPicker.addEventListener('change', function () {
        const color = getSelectedColor();
        if (color) filterGalleryByColor(color);
      });
    }

    // Fallback: watch the whole form
    const form = document.querySelector('form[action*="/cart/add"]');
    if (form) {
      form.addEventListener('change', function () {
        const color = getSelectedColor();
        if (color) filterGalleryByColor(color);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
