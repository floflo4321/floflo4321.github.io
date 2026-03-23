/**
 * Janton 3D 87 - Script principal
 * Menu mobile, scroll, formulaire, année dynamique
 */

(function () {
  'use strict';

  var DEFAULT_GALLERY_ITEMS = [
    {
      id: 'gal-default-1',
      src: 'assets/logo.png',
      title: 'Exemple de realisation 3D'
    }
  ];

  var DEFAULT_MODELS = [];

  var REVIEWS_KEY = 'janton_reviews';
  var REVIEWS_PENDING_KEY = 'janton_reviews_pending';
  var REVIEW_EMAIL_TO = 'janton3d87@gmail.com';

  var DEFAULT_REVIEWS = [
    {
      id: 'rev-demo-1',
      name: 'Marie L.',
      rating: 5,
      text: 'Impression rapide et qualité au rendez-vous. Je recommande pour les prototypes et pièces sur mesure.',
      date: '2025-02-01T10:00:00.000Z'
    }
  ];

  function readArrayFromStorage(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  const header = document.getElementById('header');
  const burger = document.querySelector('.burger');
  const navMobile = document.querySelector('.nav-mobile');
  const navMobileLinks = document.querySelectorAll('.nav-mobile-list a, .nav-mobile .btn');
  const contactForm = document.querySelector('.contact-form');
  const yearEl = document.getElementById('year');

  // Année dans le footer
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Menu mobile
  if (burger && navMobile) {
    function openMenu() {
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      navMobile.classList.add('is-open');
      navMobile.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      navMobile.classList.remove('is-open');
      navMobile.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function toggleMenu() {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else openMenu();
    }

    burger.addEventListener('click', toggleMenu);

    navMobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMobile.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  // Header au scroll (optionnel : fond plus marqué après un peu de scroll)
  let lastScroll = 0;
  if (header) {
    window.addEventListener('scroll', function () {
      const currentScroll = window.scrollY;
      if (currentScroll > 80) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // Catalogue modèles : priorité 1 = fichier models.json (même affichage pour tous / GitHub), 2 = admin localStorage, 3 = défauts
  var modelsCatalog = document.getElementById('models-catalog');
  var selectedModelNotice = document.getElementById('selected-model-notice');
  var selectedModelId = document.getElementById('selected-model-id');
  var selectedModelName = document.getElementById('selected-model-name');
  var selectedModelPrice = document.getElementById('selected-model-price');
  var messageField = document.getElementById('message');

  function bindModelDevisButtons() {
    if (!modelsCatalog) return;
    modelsCatalog.querySelectorAll('.model-devis-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var id = btn.dataset.modelId || '';
        var name = btn.dataset.modelName || '';
        var price = btn.dataset.modelPrice !== undefined && btn.dataset.modelPrice !== '' ? btn.dataset.modelPrice : '';
        if (selectedModelId) selectedModelId.value = id;
        if (selectedModelName) selectedModelName.value = name;
        if (selectedModelPrice) selectedModelPrice.value = price;
        if (selectedModelNotice) {
          selectedModelNotice.hidden = false;
          selectedModelNotice.innerHTML = 'Vous avez sélectionné : <strong>' + (name || 'Modèle') + '</strong>' + (price ? ' — ' + price + ' €' : '') + ' <button type="button" id="clear-model-btn">Changer</button>';
          var clearBtn = selectedModelNotice.querySelector('#clear-model-btn');
          if (clearBtn) clearBtn.addEventListener('click', function () {
            if (selectedModelId) selectedModelId.value = '';
            if (selectedModelName) selectedModelName.value = '';
            if (selectedModelPrice) selectedModelPrice.value = '';
            selectedModelNotice.hidden = true;
            selectedModelNotice.innerHTML = '';
          });
        }
        if (messageField && (name || price)) {
          var prefix = 'Je souhaite un devis pour : ' + (name || 'ce modèle') + (price ? ' (' + price + ' €). ' : '. ');
          if (!messageField.value || messageField.value.indexOf(prefix) !== 0) messageField.value = prefix + (messageField.value || '');
        }
        var contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderModelsCatalog(models) {
    if (!modelsCatalog) return;
    if (!models || models.length === 0) {
      modelsCatalog.innerHTML = '<p class="models-empty">Aucun modèle pour le moment. Éditez <strong>models.json</strong> ou consultez notre <a href="#contact">formulaire de contact</a>.</p>';
      return;
    }
    modelsCatalog.innerHTML = models.map(function (m) {
      var img = m.imageUrl
        ? '<img class="model-card-image" src="' + m.imageUrl.replace(/"/g, '&quot;') + '" alt="" loading="lazy">'
        : '<div class="model-card-image model-card-no-img">Pas d\'image</div>';
      return '<article class="model-card">' + img +
        '<div class="model-card-body">' +
        '<h3>' + (m.name || 'Modèle').replace(/</g, '&lt;') + '</h3>' +
        '<p class="model-card-price">' + (m.price != null ? m.price + ' €' : 'Sur devis') + '</p>' +
        '<p>' + (m.description || '').replace(/</g, '&lt;') + '</p>' +
        '<a href="#contact" class="btn btn-primary model-devis-btn" data-model-id="' + (m.id || '').replace(/"/g, '&quot;') + '" data-model-name="' + (m.name || '').replace(/"/g, '&quot;') + '" data-model-price="' + (m.price != null ? m.price : '') + '">Demander un devis pour ce modèle</a>' +
        '</div></article>';
    }).join('');
    bindModelDevisButtons();
  }

  function loadModelsFallback() {
    var models = readArrayFromStorage('janton_models');
    if (models.length === 0) models = DEFAULT_MODELS.slice();
    renderModelsCatalog(models);
  }

  if (modelsCatalog) {
    // Priorité à l'admin local pour voir immédiatement les modèles ajoutés.
    var localModels = readArrayFromStorage('janton_models');
    if (localModels.length > 0) {
      renderModelsCatalog(localModels);
    } else {
      fetch('models.json', { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('models.json introuvable');
          return r.json();
        })
        .then(function (data) {
          var arr = Array.isArray(data) ? data : [];
          if (arr.length > 0) {
            renderModelsCatalog(arr);
          } else {
            loadModelsFallback();
          }
        })
        .catch(function () {
          loadModelsFallback();
        });
    }
  }

  // Formulaire de contact : envoi + enregistrement devis pour l'admin
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      var name = (contactForm.querySelector('#name') || {}).value;
      var email = (contactForm.querySelector('#email') || {}).value;
      var phone = (contactForm.querySelector('#phone') || {}).value;
      var message = (contactForm.querySelector('#message') || {}).value;
      var modelId = (contactForm.querySelector('#selected-model-id') || {}).value;
      var modelName = (contactForm.querySelector('#selected-model-name') || {}).value;
      var modelPrice = (contactForm.querySelector('#selected-model-price') || {}).value;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours…';
      var devis = JSON.parse(localStorage.getItem('janton_devis') || '[]');
      var devisRow = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: name,
        email: email,
        phone: phone || '',
        message: message,
        date: new Date().toISOString(),
        status: 'en_attente'
      };
      if (modelId || modelName) {
        devisRow.modelId = modelId;
        devisRow.modelName = modelName;
        devisRow.modelPrice = modelPrice !== '' ? modelPrice : null;
      }
      devis.push(devisRow);
      localStorage.setItem('janton_devis', JSON.stringify(devis));
      setTimeout(function () {
        submitBtn.textContent = 'Message envoyé !';
        submitBtn.classList.add('btn-success');
        contactForm.reset();
        if (selectedModelId) selectedModelId.value = '';
        if (selectedModelName) selectedModelName.value = '';
        if (selectedModelPrice) selectedModelPrice.value = '';
        if (selectedModelNotice) { selectedModelNotice.hidden = true; selectedModelNotice.innerHTML = ''; }
        setTimeout(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.classList.remove('btn-success');
        }, 3000);
      }, 800);
    });
  }

  // Galerie : affichage depuis localStorage
  var galleryEl = document.getElementById('gallery');
  var lightboxEl = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  if (galleryEl) {
    var items = readArrayFromStorage('janton_gallery');
    if (items.length === 0) items = DEFAULT_GALLERY_ITEMS.slice();
    if (items.length === 0) {
      galleryEl.innerHTML = '<p class="gallery-empty">Aucune réalisation pour le moment. Revenez bientôt !</p>';
    } else {
      galleryEl.innerHTML = items.map(function (item) {
        return '<div class="gallery-item" role="listitem">' +
          '<button type="button" class="gallery-thumb" data-src="' + (item.src || '').replace(/"/g, '&quot;') + '" data-caption="' + (item.title || '').replace(/"/g, '&quot;') + '">' +
          '<img src="' + (item.src || '').replace(/"/g, '&quot;') + '" alt="' + (item.title || 'Réalisation').replace(/"/g, '&quot;') + '" loading="lazy">' +
          '<span class="gallery-title">' + (item.title || 'Réalisation') + '</span></button></div>';
      }).join('');
      galleryEl.querySelectorAll('.gallery-thumb').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var src = btn.dataset.src;
          var cap = btn.dataset.caption;
          if (lightboxImg) lightboxImg.src = src;
          if (lightboxCaption) lightboxCaption.textContent = cap;
          if (lightboxEl) {
            lightboxEl.setAttribute('aria-hidden', 'false');
            lightboxEl.classList.add('is-open');
            document.body.style.overflow = 'hidden';
          }
        });
      });
    }
  }
  if (lightboxEl) {
    function closeLightbox() {
      lightboxEl.setAttribute('aria-hidden', 'true');
      lightboxEl.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightboxEl.addEventListener('click', function (e) { if (e.target === lightboxEl) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  function renderStarsMarkup(n) {
    var r = Math.min(5, Math.max(1, parseInt(n, 10) || 5));
    var s = '';
    for (var i = 0; i < 5; i++) s += i < r ? '★' : '☆';
    return '<span class="review-stars" aria-label="' + r + ' sur 5 étoiles">' + s + '</span>';
  }

  function formatReviewDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  var reviewsListEl = document.getElementById('reviews-list');
  if (reviewsListEl) {
    function renderReviews() {
      var reviews = readArrayFromStorage(REVIEWS_KEY);
      if (reviews.length === 0) reviews = DEFAULT_REVIEWS.slice();
      reviews.sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
      reviewsListEl.innerHTML = reviews.map(function (r) {
        var name = (r.name || 'Client').replace(/</g, '&lt;');
        var text = (r.text || '').replace(/</g, '&lt;');
        return '<article class="review-card" role="listitem">' +
          renderStarsMarkup(r.rating) +
          '<blockquote>« ' + text + ' »</blockquote>' +
          '<p class="review-author">' + name + '</p>' +
          (r.date ? '<p class="review-date">' + formatReviewDate(r.date) + '</p>' : '') +
          '</article>';
      }).join('');
    }
    renderReviews();
  }

  var reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('review-name') || {}).value.trim();
      var email = (document.getElementById('review-email') || {}).value.trim();
      var rating = (document.getElementById('review-rating') || {}).value;
      var text = (document.getElementById('review-text') || {}).value.trim();
      if (!name || !email || !rating || !text) return;
      var pending = readArrayFromStorage(REVIEWS_PENDING_KEY);
      pending.push({
        id: 'pend-' + Date.now(),
        name: name,
        email: email,
        rating: parseInt(rating, 10),
        text: text,
        date: new Date().toISOString()
      });
      try {
        localStorage.setItem(REVIEWS_PENDING_KEY, JSON.stringify(pending));
      } catch (err) {}
      var body = 'Nouvel avis client (à modérer)\n\n' +
        'Nom : ' + name + '\n' +
        'E-mail : ' + email + '\n' +
        'Note : ' + rating + ' / 5\n\n' +
        'Message :\n' + text + '\n\n' +
        '— Envoyé depuis le site Janton 3D 87';
      var mailto = 'mailto:' + REVIEW_EMAIL_TO +
        '?subject=' + encodeURIComponent('[Avis site] ' + name) +
        '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
      reviewForm.reset();
      alert('Merci ! Votre messagerie s’ouvre pour envoyer l’avis. Après validation, il pourra être affiché sur le site.');
    });
  }

  // Smooth scroll pour ancres (amélioration si besoin)
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
