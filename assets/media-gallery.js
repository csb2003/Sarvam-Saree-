if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();

        // Trigger 1: setInterval — polls URL for variant change
        let lastVariant = new URLSearchParams(window.location.search).get('variant');
        setInterval(() => {
          const currentVariant = new URLSearchParams(window.location.search).get('variant');
          if (currentVariant !== lastVariant) {
            lastVariant = currentVariant;
            setTimeout(() => this.filterByVariantColor(), 200);
          }
        }, 100);

        // Trigger 2: MutationObserver — watches DOM for variant input changes
        const observer = new MutationObserver(() => {
          setTimeout(() => this.filterByVariantColor(), 200);
        });
        const variantSelects = document.querySelector('variant-selects');
        if (variantSelects) {
          observer.observe(variantSelects, { attributes: true, childList: true, subtree: true });
        }

        // Trigger 3: change event on swatch inputs as final fallback
        document.addEventListener('change', (e) => {
          if (e.target.classList.contains('swatch-input__input')) {
            setTimeout(() => this.filterByVariantColor(), 200);
          }
        });
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        this.filterByVariantColor();
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) return;

        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);
          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail && activeThumbnail.parentElement.prepend(activeThumbnail);
          }
          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;
        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;
        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }

      filterByVariantColor() {
        const colorInput = document.querySelector('.swatch-input__input:checked');
        const select = document.querySelector('[name="Color"], [name="color"]');

        const color = colorInput
          ? colorInput.value.toLowerCase().trim()
          : select
          ? select.value.toLowerCase().trim()
          : null;

        if (!color) return;

        // Filter main gallery items
        document.querySelectorAll('[data-media-id]').forEach((item) => {
          const img = item.querySelector('img');
          if (!img) return;
          const alt = (img.alt || '').toLowerCase().trim();
          if (alt === color) {
            item.classList.remove('color-hidden');
          } else {
            item.classList.add('color-hidden');
          }
        });

        // Filter thumbnail strip items
        document.querySelectorAll('[id^="GalleryThumbnails"] li[data-target]').forEach((thumb) => {
          const img = thumb.querySelector('img');
          if (!img) return;
          const alt = (img.alt || '').toLowerCase().trim();
          if (alt === color) {
            thumb.classList.remove('color-hidden');
          } else {
            thumb.classList.add('color-hidden');
          }
        });
      }
    }
  );
}
