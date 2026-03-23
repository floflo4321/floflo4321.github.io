/**
 * Janton 3D 87 - Administration
 * Devis (accepter/refuser), factures, galerie. Paiement carte bleue uniquement.
 */

(function () {
  'use strict';

  var ADMIN_ACCESS_KEY = 'janton87pro'; // Changez cette clé pour votre URL privée
  var accessParam = '';
  try {
    accessParam = new URLSearchParams(window.location.search).get('access') || '';
  } catch (e) {
    accessParam = '';
  }
  if (accessParam !== ADMIN_ACCESS_KEY) {
    window.location.replace('index.html');
    return;
  }

  // Hash SHA-256 du mot de passe admin (évite d'exposer le mot de passe en clair dans le code).
  // Mot de passe actuel conservé: "janton87"
  var ADMIN_PASSWORD_HASH = 'b2dc5a3446f442721ccbd2f6232bd7f799f82a9eec395f4db75a97ae872e2f93';
  var SESSION_KEY = 'janton_admin_session';
  var DEVIS_KEY = 'janton_devis';
  var FACTURES_KEY = 'janton_factures';
  var GALLERY_KEY = 'janton_gallery';
  var MODELS_KEY = 'janton_models';
  var REVIEWS_KEY = 'janton_reviews';
  var REVIEWS_PENDING_KEY = 'janton_reviews_pending';

  var loginScreen = document.getElementById('admin-login-screen');
  var adminMain = document.getElementById('admin-main');
  var loginForm = document.getElementById('login-form');
  var adminPassword = document.getElementById('admin-password');
  var logoutBtn = document.getElementById('admin-logout');
  var devisList = document.getElementById('devis-list');
  var facturesList = document.getElementById('factures-list');
  var galerieList = document.getElementById('galerie-list');
  var galerieForm = document.getElementById('galerie-form');
  var modelesList = document.getElementById('modeles-list');
  var modelesForm = document.getElementById('modeles-form');
  var btnNewFacture = document.getElementById('btn-new-facture');
  var modalFacture = document.getElementById('modal-facture');
  var factureForm = document.getElementById('facture-form');
  var modalFactureCancel = document.getElementById('modal-facture-cancel');
  var avisPendingList = document.getElementById('avis-pending-list');
  var avisPublishedList = document.getElementById('avis-published-list');
  var avisForm = document.getElementById('avis-form');
  var btnImportModelsJson = document.getElementById('btn-import-models-json');

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function setLoggedIn(value) {
    if (value) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function sha256Hex(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  function showAdmin() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminMain) {
      adminMain.removeAttribute('hidden');
      adminMain.setAttribute('aria-hidden', 'false');
    }
    renderDevis();
    renderFactures();
    /* Modèles : d’abord synchro models.json, puis affichage (évite 2 / 3 incohérent) */
    syncModelsFromJson(false);
    renderGalerie();
    renderAvisAdmin();
  }

  function showLogin() {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminMain) {
      adminMain.setAttribute('hidden', '');
      adminMain.setAttribute('aria-hidden', 'true');
    }
  }

  function getDevis() {
    return JSON.parse(localStorage.getItem(DEVIS_KEY) || '[]');
  }

  function setDevis(arr) {
    localStorage.setItem(DEVIS_KEY, JSON.stringify(arr));
  }

  function getFactures() {
    return JSON.parse(localStorage.getItem(FACTURES_KEY) || '[]');
  }

  function setFactures(arr) {
    localStorage.setItem(FACTURES_KEY, JSON.stringify(arr));
  }

  /** Prépare un mailto (aucun envoi automatique : le navigateur ouvre Outlook, Gmail, etc.) */
  function buildFactureMailto(f) {
    var to = (f.email || '').trim();
    var subject = 'Facture Janton 3D 87 n°' + (f.numero || f.id) + ' — Paiement par carte bancaire';
    var body = '';
    if (!to) {
      body += '(Indiquez l’adresse e-mail du client dans le champ « À » / Destinataire)\n\n';
    }
    body += 'Bonjour' + (f.clientName ? ' ' + f.clientName : '') + ',\n\n';
    body += 'Voici votre facture pour un montant de ' + (f.montant != null ? f.montant + ' €' : '—') + '.\n\n';
    if (f.paymentLink) {
      body += 'Pour régler par carte bancaire (CB uniquement), utilisez ce lien sécurisé :\n' + f.paymentLink + '\n\n';
    } else {
      body += 'Nous vous transmettrons le lien de paiement sécurisé (Stripe) sous peu.\n\n';
    }
    body += 'Cordialement,\nJanton 3D 87';

    function fullHref(b) {
      var q = 'subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(b);
      if (to) return 'mailto:' + to + '?' + q;
      return 'mailto:?' + q;
    }
    var href = fullHref(body);
    if (href.length > 1950) {
      body = 'Bonjour,\n\nMontant : ' + (f.montant != null ? f.montant + ' €' : '') + '\n\nLien de paiement :\n' + (f.paymentLink || '(à communiquer)');
      href = fullHref(body);
    }
    return href;
  }

  /** Pour mettre le lien dans du HTML (échapper & et ") */
  function escapeHrefForHtmlAttribute(href) {
    return String(href).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function openFactureEmail(f) {
    window.location.href = buildFactureMailto(f);
  }

  function getGallery() {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
  }

  function setGallery(arr) {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(arr));
  }

  function getModels() {
    return JSON.parse(localStorage.getItem(MODELS_KEY) || '[]');
  }

  function setModels(arr) {
    localStorage.setItem(MODELS_KEY, JSON.stringify(arr));
  }

  function syncModelsFromJson(showAlert) {
    return fetch('models.json', { cache: 'no-store' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('models.json indisponible');
        return resp.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('models.json invalide');
        setModels(data);
        renderModeles();
        if (showAlert) alert('Modèles et tarifs synchronisés depuis models.json.');
      })
      .catch(function () {
        /* Afficher quand même le catalogue local si models.json échoue */
        renderModeles();
        if (showAlert) alert('Impossible de synchroniser : vérifiez models.json à la racine du site.');
      });
  }

  function getReviews() {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
  }

  function setReviews(arr) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr));
  }

  function getPendingReviews() {
    return JSON.parse(localStorage.getItem(REVIEWS_PENDING_KEY) || '[]');
  }

  function setPendingReviews(arr) {
    localStorage.setItem(REVIEWS_PENDING_KEY, JSON.stringify(arr));
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  }

  // Tabs
  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var t = this.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(function (x) { x.classList.remove('is-active'); });
      document.querySelectorAll('.admin-panel').forEach(function (x) { x.classList.remove('is-active'); });
      this.classList.add('is-active');
      var panel = document.getElementById('panel-' + t);
      if (panel) panel.classList.add('is-active');
    });
  });

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var pwd = adminPassword && adminPassword.value || '';
      sha256Hex(pwd).then(function (hash) {
        if (hash === ADMIN_PASSWORD_HASH) {
          setLoggedIn(true);
          showAdmin();
        } else {
          alert('Mot de passe incorrect.');
        }
      }).catch(function () {
        alert('Erreur de vérification du mot de passe.');
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      setLoggedIn(false);
      showLogin();
      if (adminPassword) adminPassword.value = '';
    });
  }

  // Devis: render, accept, reject
  function renderDevis() {
    if (!devisList) return;
    var list = getDevis();
    if (list.length === 0) {
      devisList.innerHTML = '<p class="admin-empty">Aucune demande de devis pour le moment.</p>';
      return;
    }
    list.reverse();
    devisList.innerHTML = list.map(function (d) {
      var statusClass = d.status === 'accepte' ? 'accepte' : d.status === 'refuse' ? 'refuse' : 'en_attente';
      var actions = '';
      if (d.status === 'en_attente') {
        actions = '<div class="admin-card-actions">' +
          '<button type="button" class="btn btn-success-sm" data-devis-accept="' + d.id + '">Accepter</button>' +
          '<button type="button" class="btn btn-danger" data-devis-refuse="' + d.id + '">Refuser</button>' +
          '</div>';
      }
      return '<div class="admin-card" data-devis-id="' + d.id + '">' +
        '<div class="admin-card-header">' +
        '<span class="admin-card-title">' + (d.name || 'Sans nom') + '</span>' +
        '<span class="admin-badge ' + statusClass + '">' + d.status + '</span>' +
        '</div>' +
        '<p class="admin-card-meta">' + (d.email || '') + (d.phone ? ' · ' + d.phone : '') + '</p>' +
        (d.modelName ? '<p class="admin-card-meta"><strong>Modèle choisi :</strong> ' + (d.modelName || '').replace(/</g, '&lt;') + (d.modelPrice != null && d.modelPrice !== '' ? ' — ' + d.modelPrice + ' €' : '') + '</p>' : '') +
        '<p class="admin-card-meta">' + formatDate(d.date) + '</p>' +
        '<p>' + (d.message || '').replace(/</g, '&lt;') + '</p>' +
        actions +
        '</div>';
    }).join('');

    devisList.querySelectorAll('[data-devis-accept]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.devisAccept;
        var arr = getDevis();
        var i = arr.findIndex(function (x) { return x.id === id; });
        if (i !== -1) {
          arr[i].status = 'accepte';
          setDevis(arr);
          renderDevis();
        }
      });
    });
    devisList.querySelectorAll('[data-devis-refuse]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.devisRefuse;
        var arr = getDevis();
        var i = arr.findIndex(function (x) { return x.id === id; });
        if (i !== -1) {
          arr[i].status = 'refuse';
          setDevis(arr);
          renderDevis();
        }
      });
    });
  }

  // Factures: render, create, mark paid
  function renderFactures() {
    if (!facturesList) return;
    var list = getFactures();
    if (list.length === 0) {
      facturesList.innerHTML = '<p class="admin-empty">Aucune facture pour le moment. Cliquez sur <strong>« Créer une facture »</strong> ci-dessus (il faut un devis accepté dans l’onglet Devis). Ensuite, sur chaque facture, le gros bouton jaune <strong>« E-mail client »</strong> ouvre votre messagerie.</p>';
      return;
    }
    list.reverse();
    facturesList.innerHTML = list.map(function (f) {
      var statusClass = f.status === 'payee' ? 'payee' : 'envoyee';
      var payBtn = f.status !== 'payee' ? '<button type="button" class="btn btn-success-sm" data-facture-pay="' + f.id + '">Marquer comme payée (CB)</button>' : '';
      var copyLinkBtn = f.paymentLink && f.status !== 'payee'
        ? '<button type="button" class="btn btn-outline btn-sm" data-facture-copy-link="' + f.id + '" title="Copier le lien pour l\'envoyer au client">Copier le lien de paiement</button>'
        : '';
      var mailHref = '';
      try {
        mailHref = escapeHrefForHtmlAttribute(buildFactureMailto(f));
      } catch (err) {
        mailHref = escapeHrefForHtmlAttribute('mailto:?subject=Facture Janton 3D 87&body=Rechargez la page (Ctrl+F5) puis réessayez.');
      }
      /* Toujours afficher : même si « payée », utile pour renvoyer le mail ou vérifier */
      var emailClientBtn = '<a class="btn btn-primary btn-sm admin-btn-email" href="' + mailHref + '" style="display:inline-flex !important;align-items:center;justify-content:center;padding:0.65rem 1.15rem;background:#e8c547;color:#1a1520;font-weight:700;border-radius:8px;text-decoration:none;border:2px solid #c9a832;">E-mail client</a>';
      var linkInfo = f.paymentLink ? '<p class="admin-card-meta">Lien Stripe : le site ne l’envoie pas seul — utilisez le bouton e-mail ou copiez le lien.</p>' : '<p class="admin-card-meta">Ajoutez un lien Stripe lors de la création pour l’inclure dans l’e-mail au client.</p>';
      return '<div class="admin-card">' +
        '<div class="admin-card-header">' +
        '<span class="admin-card-title">Facture #' + (f.numero || f.id) + ' — ' + (f.clientName || '') + '</span>' +
        '<span class="admin-badge ' + statusClass + '">' + f.status + '</span>' +
        '</div>' +
        '<p class="admin-card-meta">' + (f.email || '') + ' · ' + (f.montant != null ? f.montant + ' €' : '') + '</p>' +
        '<p class="admin-card-meta">Paiement : carte bleue uniquement.</p>' +
        linkInfo +
        '<div class="admin-card-actions">' + emailClientBtn + copyLinkBtn + payBtn + '</div>' +
        '</div>';
    }).join('');

    facturesList.querySelectorAll('[data-facture-pay]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.facturePay;
        var arr = getFactures();
        var i = arr.findIndex(function (x) { return x.id === id; });
        if (i !== -1) {
          arr[i].status = 'payee';
          setFactures(arr);
          renderFactures();
        }
      });
    });
    facturesList.querySelectorAll('[data-facture-copy-link]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.factureCopyLink;
        var arr = getFactures();
        var f = arr.find(function (x) { return x.id === id; });
        if (f && f.paymentLink) {
          navigator.clipboard.writeText(f.paymentLink).then(function () {
            btn.textContent = 'Lien copié !';
            setTimeout(function () { btn.textContent = 'Copier le lien de paiement'; }, 2000);
          }).catch(function () {
            prompt('Copiez ce lien pour l\'envoyer au client :', f.paymentLink);
          });
        }
      });
    });
  }

  // Ouvrir modal facture : choisir un devis accepté
  if (btnNewFacture) {
    btnNewFacture.addEventListener('click', function () {
      var devis = getDevis().filter(function (d) { return d.status === 'accepte'; });
      if (devis.length === 0) {
        alert('Aucun devis accepté. Acceptez d’abord un devis depuis l’onglet Devis.');
        return;
      }
      var options = devis.map(function (d) {
        return { id: d.id, name: d.name, email: d.email };
      });
      var choice = options[0];
      if (options.length > 1) {
        var names = options.map(function (o, i) { return (i + 1) + '. ' + o.name; }).join('\n');
        var idx = prompt('Devis acceptés :\n' + names + '\n\nEntrez le numéro (1 à ' + options.length + ')');
        if (idx != null) {
          var n = parseInt(idx, 10);
          if (n >= 1 && n <= options.length) choice = options[n - 1];
        }
      }
      document.getElementById('facture-devis-id').value = choice.id;
      document.getElementById('facture-client').value = choice.name || '';
      document.getElementById('facture-email').value = choice.email || '';
      document.getElementById('facture-montant').value = '';
      modalFacture.setAttribute('aria-hidden', 'false');
      modalFacture.classList.add('is-open');
    });
  }

  if (factureForm) {
    factureForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var devisId = document.getElementById('facture-devis-id').value;
      var client = document.getElementById('facture-client').value;
      var email = document.getElementById('facture-email').value;
      var montant = document.getElementById('facture-montant').value;
      var factures = getFactures();
      var numero = (factures.length + 1);
      var paymentLink = (document.getElementById('facture-payment-link') || {}).value.trim();
      var newFact = {
        id: 'FAC-' + Date.now(),
        numero: numero,
        devisId: devisId,
        clientName: client,
        email: email,
        montant: parseFloat(montant) || 0,
        date: new Date().toISOString(),
        status: 'envoyee',
        paymentMethod: 'carte_bleue',
        paymentLink: paymentLink || null
      };
      factures.push(newFact);
      setFactures(factures);
      modalFacture.classList.remove('is-open');
      modalFacture.setAttribute('aria-hidden', 'true');
      factureForm.reset();
      var pl = document.getElementById('facture-payment-link');
      if (pl) pl.value = '';
      renderFactures();
      if (window.confirm('La facture est enregistrée localement.\n\nCe site n’envoie pas d’e-mail automatiquement.\n\nVoulez-vous ouvrir votre messagerie maintenant (bouton « E-mail client ») ?')) {
        openFactureEmail(newFact);
      }
    });
  }

  if (modalFactureCancel) {
    modalFactureCancel.addEventListener('click', function () {
      modalFacture.classList.remove('is-open');
      modalFacture.setAttribute('aria-hidden', 'true');
    });
  }

  modalFacture && modalFacture.addEventListener('click', function (e) {
    if (e.target === modalFacture) {
      modalFacture.classList.remove('is-open');
      modalFacture.setAttribute('aria-hidden', 'true');
    }
  });

  // Galerie: add (fichier ou URL), delete
  function compressImageAsDataUrl(file, maxWidth, quality, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var type = file.type || 'image/jpeg';
        var dataUrl = canvas.toDataURL(type, quality);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderGalerie() {
    if (!galerieList) return;
    var list = getGallery();
    if (list.length === 0) {
      galerieList.innerHTML = '<p class="admin-empty">Aucune photo. Ajoutez un fichier (ou une URL) et un titre ci-dessus.</p>';
      return;
    }
    galerieList.innerHTML = list.map(function (item) {
      return '<div class="admin-gallery-item" data-gal-id="' + item.id + '">' +
        '<img src="' + (item.src || '').replace(/"/g, '&quot;') + '" alt="' + (item.title || '').replace(/"/g, '&quot;') + '" onerror="this.style.background=\'#333\';this.alt=\'Image non chargée\'">' +
        '<p>' + (item.title || 'Sans titre').replace(/</g, '&lt;') + '</p>' +
        '<div class="admin-card-actions"><button type="button" class="btn btn-danger btn-sm" data-gal-delete="' + item.id + '">Supprimer</button></div>' +
        '</div>';
    }).join('');

    galerieList.querySelectorAll('[data-gal-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.galDelete;
        var arr = getGallery().filter(function (x) { return x.id !== id; });
        setGallery(arr);
        renderGalerie();
      });
    });
  }

  if (galerieForm) {
    galerieForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var title = (document.getElementById('gal-title') || {}).value.trim();
      var urlInput = document.getElementById('gal-src');
      var fileInput = document.getElementById('gal-file');
      var src = urlInput ? urlInput.value.trim() : '';
      var file = fileInput && fileInput.files && fileInput.files[0];
      if (!title) return;
      if (file) {
        var maxWidth = 1200;
        var quality = 0.85;
        compressImageAsDataUrl(file, maxWidth, quality, function (dataUrl) {
          var arr = getGallery();
          arr.push({
            id: 'gal-' + Date.now(),
            src: dataUrl,
            title: title
          });
          setGallery(arr);
          if (urlInput) urlInput.value = '';
          if (fileInput) fileInput.value = '';
          document.getElementById('gal-title').value = '';
          renderGalerie();
        });
      } else if (src) {
        var arr = getGallery();
        arr.push({
          id: 'gal-' + Date.now(),
          src: src,
          title: title
        });
        setGallery(arr);
        urlInput.value = '';
        if (fileInput) fileInput.value = '';
        document.getElementById('gal-title').value = '';
        renderGalerie();
      } else {
        alert('Choisissez une photo (fichier) ou indiquez une URL d’image.');
      }
    });
  }

  // Modèles & tarifs: add, delete
  function renderModeles() {
    if (!modelesList) return;
    var list = getModels();
    if (list.length === 0) {
      modelesList.innerHTML = '<p class="admin-empty">Aucun modèle. Les clients verront le catalogue une fois que vous en ajoutez.</p>';
      return;
    }
    modelesList.innerHTML = list.map(function (m) {
      var img = m.imageUrl
        ? '<img src="' + (m.imageUrl || '').replace(/"/g, '&quot;') + '" alt="">'
        : '<div style="aspect-ratio:4/3;background:var(--color-bg);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:0.85rem;">Sans image</div>';
      return '<div class="admin-model-card">' + img +
        '<span class="admin-card-title">' + (m.name || 'Sans nom').replace(/</g, '&lt;') + '</span>' +
        '<p class="admin-card-meta">' + (m.price != null ? m.price + ' €' : 'Sur devis') + '</p>' +
        '<div class="admin-card-actions"><button type="button" class="btn btn-danger btn-sm" data-mod-delete="' + (m.id || '').replace(/"/g, '&quot;') + '">Supprimer</button></div>' +
        '</div>';
    }).join('');
    modelesList.querySelectorAll('[data-mod-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.modDelete;
        var arr = getModels().filter(function (x) { return x.id !== id; });
        setModels(arr);
        renderModeles();
      });
    });
  }

  if (modelesForm) {
    modelesForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('mod-nom').value.trim();
      var description = (document.getElementById('mod-desc') || {}).value.trim();
      var priceRaw = (document.getElementById('mod-prix') || {}).value.trim();
      var price = priceRaw === '' ? null : parseFloat(priceRaw);
      var imageUrlInput = document.getElementById('mod-image');
      var imageFileInput = document.getElementById('mod-image-file');
      var imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';
      var imageFile = imageFileInput && imageFileInput.files && imageFileInput.files[0];
      if (!name) return;
      function addModel(imgUrl) {
        var arr = getModels();
        arr.push({
          id: 'mod-' + Date.now(),
          name: name,
          description: description,
          price: price,
          imageUrl: imgUrl || null
        });
        setModels(arr);
        document.getElementById('mod-nom').value = '';
        if (document.getElementById('mod-desc')) document.getElementById('mod-desc').value = '';
        if (document.getElementById('mod-prix')) document.getElementById('mod-prix').value = '';
        if (imageUrlInput) imageUrlInput.value = '';
        if (imageFileInput) imageFileInput.value = '';
        renderModeles();
      }
      if (imageFile) {
        compressImageAsDataUrl(imageFile, 1200, 0.85, function (dataUrl) {
          addModel(dataUrl);
        });
      } else {
        addModel(imageUrl || null);
      }
    });
  }

  var btnExportModelsJson = document.getElementById('btn-export-models-json');
  if (btnImportModelsJson) {
    btnImportModelsJson.addEventListener('click', function () {
      syncModelsFromJson(true);
    });
  }
  if (btnExportModelsJson) {
    btnExportModelsJson.addEventListener('click', function () {
      var arr = getModels();
      var json = JSON.stringify(arr, null, 2);
      var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'models.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Fichier models.json téléchargé. Remplacez le fichier du même nom à la racine du site, puis enregistrez / envoyez sur GitHub pour mettre à jour le catalogue public.');
    });
  }

  // Avis clients (publication + file d’attente)
  function renderAvisAdmin() {
    if (avisPendingList) {
      var pend = getPendingReviews();
      if (pend.length === 0) {
        avisPendingList.innerHTML = '<p class="admin-empty">Aucune demande en attente sur cet appareil. Les clients envoient l’avis par e-mail — vous pouvez le recopier ci-dessous (« Ajouter un avis »).</p>';
      } else {
        avisPendingList.innerHTML = pend.map(function (p) {
          return '<div class="admin-card" data-pend-id="' + (p.id || '').replace(/"/g, '&quot;') + '">' +
            '<div class="admin-card-header">' +
            '<span class="admin-card-title">' + (p.name || '').replace(/</g, '&lt;') + ' — ' + (p.rating != null ? p.rating + '/5' : '') + '</span>' +
            '</div>' +
            '<p class="admin-card-meta">' + (p.email || '').replace(/</g, '&lt;') + '</p>' +
            '<p>' + (p.text || '').replace(/</g, '&lt;') + '</p>' +
            '<div class="admin-card-actions">' +
            '<button type="button" class="btn btn-success-sm" data-avis-publish="' + (p.id || '').replace(/"/g, '&quot;') + '">Publier sur le site</button>' +
            '<button type="button" class="btn btn-danger btn-sm" data-avis-pend-delete="' + (p.id || '').replace(/"/g, '&quot;') + '">Supprimer</button>' +
            '</div></div>';
        }).join('');
        avisPendingList.querySelectorAll('[data-avis-publish]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.avisPublish;
            var list = getPendingReviews();
            var item = list.find(function (x) { return x.id === id; });
            if (!item) return;
            setPendingReviews(list.filter(function (x) { return x.id !== id; }));
            var pub = getReviews();
            pub.push({
              id: 'rev-' + Date.now(),
              name: item.name,
              rating: item.rating,
              text: item.text,
              date: item.date || new Date().toISOString()
            });
            setReviews(pub);
            renderAvisAdmin();
          });
        });
        avisPendingList.querySelectorAll('[data-avis-pend-delete]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.avisPendDelete;
            setPendingReviews(getPendingReviews().filter(function (x) { return x.id !== id; }));
            renderAvisAdmin();
          });
        });
      }
    }
    if (avisPublishedList) {
      var revs = getReviews();
      if (revs.length === 0) {
        avisPublishedList.innerHTML = '<p class="admin-empty">Aucun avis publié. Sur la page d’accueil, des exemples s’affichent tant que la liste est vide (démo).</p>';
      } else {
        avisPublishedList.innerHTML = revs.map(function (r) {
          return '<div class="admin-card">' +
            '<div class="admin-card-header">' +
            '<span class="admin-card-title">' + (r.name || '').replace(/</g, '&lt;') + ' — ' + (r.rating != null ? r.rating + '/5' : '') + '</span>' +
            '</div>' +
            '<p>' + (r.text || '').replace(/</g, '&lt;') + '</p>' +
            '<div class="admin-card-actions">' +
            '<button type="button" class="btn btn-danger btn-sm" data-avis-rev-delete="' + (r.id || '').replace(/"/g, '&quot;') + '">Retirer du site</button>' +
            '</div></div>';
        }).join('');
        avisPublishedList.querySelectorAll('[data-avis-rev-delete]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.avisRevDelete;
            setReviews(getReviews().filter(function (x) { return x.id !== id; }));
            renderAvisAdmin();
          });
        });
      }
    }
  }

  if (avisForm) {
    avisForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = document.getElementById('avis-nom').value.trim();
      var note = parseInt(document.getElementById('avis-note').value, 10);
      var texte = document.getElementById('avis-texte').value.trim();
      if (!nom || !texte) return;
      var pub = getReviews();
      pub.push({
        id: 'rev-' + Date.now(),
        name: nom,
        rating: note,
        text: texte,
        date: new Date().toISOString()
      });
      setReviews(pub);
      avisForm.reset();
      document.getElementById('avis-note').value = '5';
      renderAvisAdmin();
    });
  }

  // Init
  if (isLoggedIn()) {
    showAdmin();
  } else {
    showLogin();
  }
})();
