// ==========================================
// 1. PEGA AQUÍ TUS CREDENCIALES DE JSONBIN
// ==========================================
const BIN_ID = '69e3efdc36566621a8c9bc32'; 
const API_KEY = 'AQUI_PEGAS_EL_CODIGO_SUPER_LARGO_QUE_EMPIEZA_CON_$2a$';
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    let carrito = [];
    let currentItemObj = null;
    let lastAddedIndex = -1; 
    let editingIndex = -1; 
    
    // Flag para el modo administrador
    let isAdminUnlocked = false; 

    const modalElement = document.getElementById('customizationModal');
    const bsModal = new bootstrap.Modal(modalElement);

    const successModalElement = document.getElementById('successModal');
    const successModal = new bootstrap.Modal(successModalElement);

    // VARIABLES DE LA PROMOCIÓN
    let currentPromoName = "Nuestra Promoción del miércoles";
    let currentPromoDesc = "Roll relleno de pescado blanco empanizado, queso crema y cebollín con topping de plátano, punto de queso crema y salsa anguila.";
    let currentPromoPrice = 12.00;
    let currentPromoDay = 3; 
    let currentPromoImg = "images/IMAGENPROMOCION.jpeg";
    const dayNames = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

    const adicionalesList = [
        { name: "Aguacate", price: 0.30 },
        { name: "Plátano", price: 0.30 },
        { name: "Wakame", price: 2.50 },
        { name: "Salmón", price: 3.00 },
        { name: "Pulpo", price: 2.00 },
        { name: "Papas Fritas", price: 3.00 },
        { name: "Pasta Dinamita", price: 2.50 },
        { name: "Pescado", price: 1.00 },
        { name: "Camarón", price: 2.00 },
        { name: "Pollo", price: 1.00 },
        { name: "Cangrejo", price: 1.50 },
        { name: "Tocineta", price: 1.00 },
        { name: "Queso Crema", price: 1.00 }
    ];
    
    // ==========================================
    // SISTEMA DE NUBE (JSONBIN)
    // ==========================================
    
    // Cargar datos al iniciar la página
    async function cargarDatosDesdeLaNube() {
        try {
            let respuesta = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            let datos = await respuesta.json();
            
            // 1. Aplicar datos de la Promoción
            if (datos.record.promo) {
                currentPromoName = datos.record.promo.promoName;
                currentPromoDesc = datos.record.promo.promoDesc;
                currentPromoPrice = datos.record.promo.promoPrice;
                currentPromoDay = datos.record.promo.promoDay;
                currentPromoImg = datos.record.promo.promoImg;

                let dayNameStr = dayNames[currentPromoDay];
                let titleEl = document.getElementById('dynamicPromoTitle');
                if(titleEl) {
                    titleEl.textContent = currentPromoName;
                    document.getElementById('dynamicPromoDesc').textContent = currentPromoDesc;
                    document.getElementById('dynamicPromoImg').src = currentPromoImg;
                    document.getElementById('dynamicPromoPriceText').textContent = "Precio: $" + currentPromoPrice.toFixed(2);
                    document.getElementById('dynamicPromoNote').textContent = `(Nuestras promociones solo están disponibles los días ${dayNameStr} de 12:00 AM a 11:00 PM)`;
                    document.getElementById('promoAlertDayText').textContent = dayNameStr;
                }
            }

            // 2. Aplicar datos del Menú si existen en la nube
            if (datos.record.menu && datos.record.menu.length > 0) {
                document.querySelectorAll('.menu-block').forEach((block, index) => {
                    let data = datos.record.menu[index];
                    if(data) {
                        let nameEl = block.querySelector('.item-name');
                        let priceEl = block.querySelector('.item-price');
                        let descEl = block.querySelector('.item-desc');

                        if(nameEl) {
                            let badges = nameEl.innerHTML.match(/<span class="badge.*?<\/span>/g) || [];
                            nameEl.innerHTML = `${data.name} ${badges.join(' ')}`;
                        }
                        if(priceEl) priceEl.textContent = `$${data.price.toFixed(2)}`;
                        if(descEl) descEl.textContent = data.desc;
                    }
                });
            }
        } catch (error) {
            console.error("Error cargando los datos de la nube", error);
        }
    }

    // Extraer el estado actual del menú desde el HTML
    function obtenerEstadoDelMenu() {
        let menuArray = [];
        document.querySelectorAll('.menu-block').forEach(block => {
            let nameEl = block.querySelector('.item-name');
            let priceEl = block.querySelector('.item-price');
            let descEl = block.querySelector('.item-desc');

            let plainName = nameEl ? getCleanText(nameEl) : '';
            let priceVal = priceEl ? parseFloat(getCleanText(priceEl).replace('$', '')) : 0;
            let desc = descEl ? getCleanText(descEl) : '';

            menuArray.push({ name: plainName, price: priceVal, desc: desc });
        });
        return menuArray;
    }

    // Guardar TODO en la nube
    async function guardarEnLaNube() {
        let botonGuardarPromo = document.getElementById('saveAdminPromoBtn');
        let botonGuardarMenu = document.getElementById('updateProductBtn');
        
        let textoOriginalPromo = botonGuardarPromo.textContent;
        let textoOriginalMenu = botonGuardarMenu.textContent;

        botonGuardarPromo.textContent = "Guardando en la nube...";
        botonGuardarMenu.textContent = "Guardando en la nube...";

        let nuevosDatos = {
            promo: {
                promoName: currentPromoName,
                promoDesc: currentPromoDesc,
                promoPrice: currentPromoPrice,
                promoDay: currentPromoDay,
                promoImg: currentPromoImg
            },
            menu: obtenerEstadoDelMenu()
        };

        try {
            let respuesta = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(nuevosDatos)
            });

            if(respuesta.ok) {
                alert("¡Éxito! Todos los cambios se han guardado en la nube y son visibles para tus clientes.");
            } else {
                alert("Hubo un error conectando con la base de datos (JSONBin). La imagen podría seguir siendo muy pesada.");
            }
        } catch (error) {
            alert("Error de conexión. Intenta de nuevo.");
            console.error(error);
        } finally {
            botonGuardarPromo.textContent = textoOriginalPromo;
            botonGuardarMenu.textContent = textoOriginalMenu;
        }
    }

    // Arrancamos la descarga de datos
    cargarDatosDesdeLaNube();

    // ==========================================
    // LÓGICA DE INTERFAZ Y CARRITO
    // ==========================================

    function getCleanText(element) {
        let clone = element.cloneNode(true);
        let badges = clone.querySelectorAll('.badge');
        badges.forEach(b => b.remove());
        return clone.textContent.trim();
    }

    function populateAdminProducts() {
        const select = document.getElementById('adminProductSelect');
        select.innerHTML = '';
        document.querySelectorAll('.menu-block').forEach((block, index) => {
            let nameEl = block.querySelector('.item-name');
            let priceEl = block.querySelector('.item-price');
            let descEl = block.querySelector('.item-desc');
            
            if(nameEl && priceEl) {
                let name = getCleanText(nameEl);
                let price = parseFloat(getCleanText(priceEl).replace('$', ''));
                let desc = descEl ? getCleanText(descEl) : '';
                
                let option = document.createElement('option');
                option.value = index;
                option.textContent = `${name} - $${price.toFixed(2)}`;
                option.dataset.price = price;
                option.dataset.name = name;
                option.dataset.desc = desc;
                
                let badges = nameEl.innerHTML.match(/<span class="badge.*?<\/span>/g) || [];
                option.dataset.badges = badges.join(' ');

                select.appendChild(option);
            }
        });
        
        if(select.options.length > 0) {
            updateAdminProductInputs(select.options[0]);
        }
    }

    function updateAdminProductInputs(option) {
        document.getElementById('adminProductName').value = option.dataset.name;
        document.getElementById('adminProductPrice').value = option.dataset.price;
        document.getElementById('adminProductDesc').value = option.dataset.desc;
    }

    document.getElementById('adminProductSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if(selectedOption) {
            updateAdminProductInputs(selectedOption);
        }
    });

    // Guardar MENU desde el admin
    document.getElementById('updateProductBtn').addEventListener('click', function() {
        const select = document.getElementById('adminProductSelect');
        const selectedIndex = select.value;
        const newName = document.getElementById('adminProductName').value;
        const newPrice = parseFloat(document.getElementById('adminProductPrice').value);
        const newDesc = document.getElementById('adminProductDesc').value;

        if(!isNaN(newPrice) && selectedIndex !== "") {
            const blocks = document.querySelectorAll('.menu-block');
            const block = blocks[selectedIndex];
            if(block) {
                const nameEl = block.querySelector('.item-name');
                const priceEl = block.querySelector('.item-price');
                const descEl = block.querySelector('.item-desc');
                
                if(nameEl) {
                    let badgesHtml = select.options[select.selectedIndex].dataset.badges;
                    nameEl.innerHTML = `${newName} ${badgesHtml}`;
                }
                if(priceEl) priceEl.textContent = `$${newPrice.toFixed(2)}`;
                if(descEl) descEl.textContent = newDesc;
                
                populateAdminProducts(); 
                guardarEnLaNube();
            }
        }
    });

    // Función para COMPRIMIR la imagen antes de subirla
    function comprimirImagen(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500; // Reducimos el ancho para que no pese casi nada
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Comprimimos a JPEG con calidad al 70%
                const base64Comprimido = canvas.toDataURL('image/jpeg', 0.7);
                callback(base64Comprimido);
            }
        }
    }

    // Guardar PROMO desde el admin
    document.getElementById('saveAdminPromoBtn').addEventListener('click', function() {
        currentPromoName = document.getElementById('adminPromoName').value;
        currentPromoDesc = document.getElementById('adminPromoDesc').value;
        currentPromoPrice = parseFloat(document.getElementById('adminPromoPrice').value);
        currentPromoDay = parseInt(document.getElementById('adminPromoDay').value);

        let fileInput = document.getElementById('adminPromoImgFile');
        let dayNameStr = dayNames[currentPromoDay];

        if (fileInput && fileInput.files && fileInput.files[0]) {
            // Usamos el compresor mágico para evitar el error de JSONBin
            comprimirImagen(fileInput.files[0], function(imagenComprimida) {
                currentPromoImg = imagenComprimida; 
                actualizarDOMPromocionYGuardar(dayNameStr);
            });
        } else {
            actualizarDOMPromocionYGuardar(dayNameStr);
        }

        function actualizarDOMPromocionYGuardar(dayName) {
            document.getElementById('dynamicPromoTitle').textContent = currentPromoName;
            document.getElementById('dynamicPromoDesc').textContent = currentPromoDesc;
            document.getElementById('dynamicPromoImg').src = currentPromoImg;
            document.getElementById('dynamicPromoPriceText').textContent = "Precio: $" + currentPromoPrice.toFixed(2);
            document.getElementById('dynamicPromoNote').textContent = `(Nuestras promociones solo están disponibles los días ${dayName} de 12:00 AM a 11:00 PM)`;
            document.getElementById('promoAlertDayText').textContent = dayName;

            guardarEnLaNube();
            let adminModalEl = document.getElementById('adminPromoModal');
            let adminModal = bootstrap.Modal.getInstance(adminModalEl);
            adminModal.hide();
        }
    });

    const searchMenuInput = document.getElementById('searchMenu');
    if(searchMenuInput) {
        searchMenuInput.addEventListener('input', function() {
            let filter = this.value.toLowerCase();
            let categoryWraps = document.querySelectorAll('.menu-block-wrap');

            categoryWraps.forEach(wrap => {
                let blocks = wrap.querySelectorAll('.menu-block');
                let hasVisibleBlocks = false;

                blocks.forEach(block => {
                    let itemNameEl = block.querySelector('.item-name');
                    let itemDescEl = block.querySelector('.item-desc');
                    
                    let itemNameText = itemNameEl ? itemNameEl.textContent.toLowerCase() : '';
                    let itemDescText = itemDescEl ? itemDescEl.textContent.toLowerCase() : '';

                    if(itemNameText.includes(filter) || itemDescText.includes(filter)) {
                        block.style.setProperty('display', 'block', 'important');
                        hasVisibleBlocks = true;
                    } else {
                        block.style.setProperty('display', 'none', 'important');
                    }
                });

                if(hasVisibleBlocks) {
                    wrap.style.display = 'block';
                } else {
                    wrap.style.display = 'none';
                }
            });
        });
    }

    const originalDestinoSelect = document.getElementById('destino').cloneNode(true);
    document.getElementById('searchDestino').addEventListener('input', function() {
        let filter = this.value.toLowerCase();
        let currentSelect = document.getElementById('destino');
        currentSelect.innerHTML = '';
        
        currentSelect.appendChild(originalDestinoSelect.options[0].cloneNode(true));

        Array.from(originalDestinoSelect.children).forEach(child => {
            if (child.tagName === 'OPTGROUP') {
                let newOptgroup = child.cloneNode(false);
                let hasOptions = false;
                Array.from(child.children).forEach(opt => {
                    if (opt.text.toLowerCase().includes(filter)) {
                        newOptgroup.appendChild(opt.cloneNode(true));
                        hasOptions = true;
                    }
                });
                if (hasOptions) currentSelect.appendChild(newOptgroup);
            } else if (child.tagName === 'OPTION' && child.index > 0) {
                if (child.text.toLowerCase().includes(filter)) {
                    currentSelect.appendChild(child.cloneNode(true));
                }
            }
        });
        
        renderInvoice();
    });

    const promoBtn = document.getElementById('promoBtn');
    if (promoBtn) {
        promoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            let now = new Date();
            let currentDay = now.getDay(); 
            let currentHour = now.getHours(); 
            
            let esDiaCorrecto = (currentDay === currentPromoDay);
            let esHoraCorrecta = (currentHour >= 0 && currentHour < 23); 
            
            if (esDiaCorrecto && esHoraCorrecta) { 
                let promoItem = {
                    originalName: currentPromoName,
                    basePrice: currentPromoPrice,
                    basePriceStr: `$${currentPromoPrice.toFixed(2)}`,
                    description: currentPromoDesc,
                    itemType: 'food',
                    canExclude: true, 
                    excluded: [],
                    extras: [],
                    flavor: null
                };
                openCustomizationModal(promoItem, -1);
            } else {
                let promoModal = new bootstrap.Modal(document.getElementById('promoAlertModal'));
                promoModal.show();
            }
        });
    }

    modalElement.addEventListener('show.bs.modal', function () {
        document.body.classList.add('modal-open');
        let navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.setProperty('z-index', '10', 'important');
        }
    });

    modalElement.addEventListener('hidden.bs.modal', function () {
        document.body.classList.remove('modal-open');
        let navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.removeProperty('z-index');
        }
    });

    function splitIngredients(desc) {
        let text = desc.replace(/\.$/, ''); 
        text = text.replace(/topping de cangrejo y aguacate/gi, "topping de cangrejo, topping de aguacate");
        let parts = text.split(/,|\sy\s/i);
        return parts.map(p => p.trim()).filter(p => p.length > 0);
    }

    function updateTotalModal() {
        let tempTotal = currentItemObj.basePrice;
        document.querySelectorAll('.extra-checkbox:checked').forEach(cb => {
            tempTotal += parseFloat(cb.getAttribute('data-price'));
        });
        document.getElementById('modalCurrentTotal').textContent = `$${tempTotal.toFixed(2)}`;
    }

    function openCustomizationModal(itemData, editIdx = -1) {
        editingIndex = editIdx;
        currentItemObj = itemData;
        
        document.getElementById('modalItemName').textContent = itemData.originalName;
        document.getElementById('modalItemPrice').textContent = itemData.basePriceStr;
        
        const ingredientsBox = document.getElementById('modalIngredientsList');
        const extrasBox = document.getElementById('modalExtrasList');
        const flavorBox = document.getElementById('modalFlavorList');
        
        ingredientsBox.innerHTML = ''; 
        extrasBox.innerHTML = ''; 
        flavorBox.innerHTML = '';

        let isNestea = itemData.originalName.toLowerCase().includes("nestea");
        let isJugo = itemData.originalName.toLowerCase().includes("jugos naturales");
        let isRefresco1L = itemData.originalName.toLowerCase().includes("bebidas de 1 litro");
        let isRefresco15L = itemData.originalName.toLowerCase().includes("bebidas de 1.5 litros");

        if (isNestea || isJugo || isRefresco1L || isRefresco15L) {
            document.getElementById('flavorSection').style.display = 'block';
            
            let flavors = [];
            if (isNestea) {
                flavors = ['Durazno', 'Limón'];
            } else if (isJugo) {
                flavors = ['Fresa', 'Parchita', 'Durazno'];
            } else if (isRefresco1L || isRefresco15L) {
                flavors = ['Coca Cola', 'Naranja', 'Chinoto', 'Uva', 'Frescolita', 'Toronja'];
            }

            let html = '';
            flavors.forEach((f, i) => {
                let isChecked = (editIdx !== -1 && itemData.flavor === f) || (editIdx === -1 && i === 0);
                html += `
                    <div class="form-check p-2 rounded border border-secondary" style="background-color:#f8f9fa;">
                        <input class="form-check-input flavor-radio ms-1 me-2 border-secondary" type="radio" name="flavorRadio" value="${f}" id="flavor_${i}" ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label w-100 text-dark" for="flavor_${i}" style="cursor:pointer;">
                            Sabor a ${f}
                        </label>
                    </div>
                `;
            });
            flavorBox.innerHTML = html;
        } else {
            document.getElementById('flavorSection').style.display = 'none';
        }

        if(itemData.itemType === 'food') {
            document.getElementById('extrasSection').style.display = 'block';

            if (itemData.canExclude) {
                document.getElementById('exclusionsSection').style.display = 'block';
                let ingredients = splitIngredients(itemData.description);
                
                if(ingredients.length > 0) {
                    ingredients.shift(); 
                }

                if(ingredients.length > 0) {
                    ingredients.forEach((ing, index) => {
                        let loweredIng = ing.toLowerCase();
                        if(loweredIng.includes("camaron") && loweredIng.includes("tempurizado") || loweredIng.includes("camarones tempurizados")){
                            return; 
                        }

                        let isChecked = (editIdx !== -1 && itemData.excluded.includes(ing));

                        const div = document.createElement('div');
                        div.className = 'form-check ingredient-item p-2 rounded border border-secondary';
                        div.innerHTML = `
                            <input class="form-check-input ms-1 me-2 exclude-checkbox border-secondary" type="checkbox" value="${ing}" id="ing_${index}" ${isChecked ? 'checked' : ''}>
                            <label class="form-check-label w-100 text-dark" for="ing_${index}" style="cursor:pointer;">
                                Sin ${ing}
                            </label>
                        `;
                        ingredientsBox.appendChild(div);
                    });
                } 
                
                if(ingredientsBox.innerHTML === '') {
                    ingredientsBox.innerHTML = '<p class="text-dark small">Sin ingredientes adicionales para excluir.</p>';
                }
            } else {
                document.getElementById('exclusionsSection').style.display = 'none';
            }

            adicionalesList.forEach((extra, index) => {
                let isChecked = (editIdx !== -1 && itemData.extras.some(e => e.name === extra.name));

                const div = document.createElement('div');
                div.className = 'form-check extra-item p-2 rounded border border-secondary';
                div.innerHTML = `
                    <input class="form-check-input ms-1 me-2 extra-checkbox border-secondary" type="checkbox" value="${extra.name}" data-price="${extra.price}" id="ext_${index}" ${isChecked ? 'checked' : ''}>
                    <label class="form-check-label w-100 d-flex justify-content-between text-dark" for="ext_${index}" style="cursor:pointer;">
                        <span>+ ${extra.name}</span>
                        <span class="fw-bold text-success">+$${extra.price.toFixed(2)}</span>
                    </label>
                `;
                extrasBox.appendChild(div);
            });

            document.querySelectorAll('.extra-checkbox').forEach(cb => {
                cb.addEventListener('change', updateTotalModal);
            });

        } else {
            document.getElementById('exclusionsSection').style.display = 'none';
            document.getElementById('extrasSection').style.display = 'none';
        }

        updateTotalModal();
        bsModal.show();
    }

    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            
            const btn = e.target;
            const block = btn.closest('.menu-block');
            const nameEl = block.querySelector('.item-name');
            const priceEl = block.querySelector('.item-price');
            const descEl = block.querySelector('.item-desc');
            const itemType = btn.getAttribute('data-type'); 

            const blockWrap = btn.closest('.menu-block-wrap');
            let categoryName = '';
            if (blockWrap) {
                const h4 = blockWrap.querySelector('h4');
                if (h4) categoryName = h4.textContent.trim().toLowerCase();
            }
            const noExcludeCategories = ['entradas', 'ek combos', 'combinados'];
            const canExclude = !noExcludeCategories.includes(categoryName);

            const name = getCleanText(nameEl);
            const priceStr = getCleanText(priceEl);
            const priceVal = parseFloat(priceStr.replace('$', ''));
            const description = descEl ? getCleanText(descEl) : '';

            const itemData = {
                originalName: name,
                basePrice: priceVal,
                basePriceStr: priceStr,
                description: description,
                itemType: itemType,
                canExclude: canExclude,
                excluded: [],
                extras: [],
                flavor: null
            };

            openCustomizationModal(itemData, -1);
        }
    });

    document.getElementById('confirmAddToCartBtn').addEventListener('click', function() {
        
        let selectedFlavorObj = null;
        if (document.getElementById('flavorSection').style.display !== 'none') {
            let selectedFlavor = document.querySelector('.flavor-radio:checked');
            if (selectedFlavor) {
                selectedFlavorObj = selectedFlavor.value;
            }
        }

        let finalItemName = currentItemObj.originalName;
        if (selectedFlavorObj) {
            finalItemName += " (Sabor: " + selectedFlavorObj + ")";
        }

        let excluded = [];
        if (document.getElementById('exclusionsSection').style.display !== 'none') {
            document.querySelectorAll('.exclude-checkbox:checked').forEach(cb => {
                excluded.push(cb.value);
            });
        }

        let chosenExtras = [];
        let extrasTotal = 0;
        document.querySelectorAll('.extra-checkbox:checked').forEach(cb => {
            let p = parseFloat(cb.getAttribute('data-price'));
            chosenExtras.push({ name: cb.value, price: p });
            extrasTotal += p;
        });

        let finalItemPrice = currentItemObj.basePrice + extrasTotal;

        let cartItem = {
            name: finalItemName,
            originalName: currentItemObj.originalName,
            description: currentItemObj.description,
            itemType: currentItemObj.itemType,
            canExclude: currentItemObj.canExclude,
            basePrice: currentItemObj.basePrice,
            basePriceStr: currentItemObj.basePriceStr,
            finalPrice: finalItemPrice,
            excluded: excluded,
            extras: chosenExtras,
            flavor: selectedFlavorObj,
            quantity: editingIndex !== -1 ? carrito[editingIndex].quantity : 1
        };

        if (editingIndex === -1) {
            carrito.push(cartItem);
            lastAddedIndex = carrito.length - 1;
        } else {
            carrito[editingIndex] = cartItem;
            lastAddedIndex = editingIndex;
        }

        document.getElementById('successItemName').textContent = finalItemName;
        document.getElementById('successItemQty').textContent = carrito[lastAddedIndex].quantity;

        bsModal.hide();
        renderInvoice();
        
        setTimeout(() => {
            successModal.show();
        }, 300);
    });

    document.getElementById('successIncreaseQty').addEventListener('click', function() {
        if (lastAddedIndex !== -1) {
            carrito[lastAddedIndex].quantity++;
            document.getElementById('successItemQty').textContent = carrito[lastAddedIndex].quantity;
            renderInvoice();
        }
    });

    document.getElementById('successDecreaseQty').addEventListener('click', function() {
        if (lastAddedIndex !== -1 && carrito[lastAddedIndex].quantity > 1) {
            carrito[lastAddedIndex].quantity--;
            document.getElementById('successItemQty').textContent = carrito[lastAddedIndex].quantity;
            renderInvoice();
        }
    });

    document.getElementById('successGoToPayBtn').addEventListener('click', function() {
        successModal.hide();
        document.getElementById('section_5').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('destino').addEventListener('change', renderInvoice);

    function renderInvoice() {
        const list = document.getElementById('invoiceList');
        const emptyMsg = document.getElementById('emptyCartMsg');
        const footer = document.getElementById('invoiceFooter');
        const totalEl = document.getElementById('invoiceTotal');
        const detailInput = document.getElementById('detallePedidoInput');

        list.innerHTML = ''; 
        let total = 0;
        let textForForm = ""; 

        if (carrito.length === 0) {
            emptyMsg.style.display = 'block';
            footer.style.display = 'none';
            detailInput.value = '';
            return;
        }

        emptyMsg.style.display = 'none';
        footer.style.display = 'flex';

        carrito.forEach((item, index) => {
            let subtotalItem = item.finalPrice * item.quantity;
            total += subtotalItem;
            
            let exText = item.excluded.length > 0 
                ? `<div class="text-danger small ms-5">↳ <em>Sin: ${item.excluded.join(', ')}</em></div>` 
                : '';
            
            let extText = '';
            item.extras.forEach(ext => {
                extText += `<div class="text-success small ms-5 fw-bold">↳ + ${ext.name} (+$${ext.price.toFixed(2)})</div>`;
            });
            
            textForForm += `- ${item.quantity}x ${item.name} ` + 
                           (item.excluded.length > 0 ? `[Sin: ${item.excluded.join(', ')}] ` : '') + 
                           (item.extras.length > 0 ? `[Extras: ${item.extras.map(e => e.name).join(', ')}] ` : '') + 
                           `=> $${subtotalItem.toFixed(2)}\n`;

            const li = document.createElement('li');
            li.className = 'invoice-item d-flex justify-content-between align-items-start';
            li.innerHTML = `
                <div class="w-100">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div class="d-flex align-items-center flex-wrap">
                            <button type="button" class="btn btn-sm btn-outline-primary px-2 py-0 me-2 edit-item-btn" data-index="${index}" title="Editar Extras/Ingredientes"><i class="bi-pencil"></i> ✏️</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary px-2 py-0 me-2 decrease-qty-btn" data-index="${index}">-</button>
                            <span class="fw-bold me-2" style="min-width: 15px; text-align: center;">${item.quantity}</span>
                            <button type="button" class="btn btn-sm btn-outline-secondary px-2 py-0 me-3 increase-qty-btn" data-index="${index}">+</button>
                            <strong>${item.name}</strong>
                        </div>
                        <span class="text-dark fw-bold fs-6">$${subtotalItem.toFixed(2)}</span>
                    </div>
                    ${exText}
                    ${extText}
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 ms-3 mt-1 remove-item-btn" data-index="${index}">x</button>
            `;
            list.appendChild(li);
        });

        document.querySelectorAll('.edit-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                const itemData = carrito[idx];
                openCustomizationModal(itemData, idx);
            });
        });

        document.querySelectorAll('.increase-qty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                carrito[idx].quantity++;
                
                if(idx === lastAddedIndex && document.getElementById('successModal').classList.contains('show')) {
                    document.getElementById('successItemQty').textContent = carrito[idx].quantity;
                }
                
                renderInvoice();
            });
        });

        document.querySelectorAll('.decrease-qty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                if (carrito[idx].quantity > 1) {
                    carrito[idx].quantity--;
                    
                    if(idx === lastAddedIndex && document.getElementById('successModal').classList.contains('show')) {
                        document.getElementById('successItemQty').textContent = carrito[idx].quantity;
                    }
                    
                    renderInvoice();
                }
            });
        });

        let destSelect = document.getElementById('destino');
        let deliveryFee = 0;
        
        if (destSelect.selectedIndex > 0 && destSelect.options[destSelect.selectedIndex].style.display !== 'none') {
            deliveryFee = parseFloat(destSelect.value);
            let destText = destSelect.options[destSelect.selectedIndex].text;
            
            let deliveryRow = document.getElementById('deliveryRow');
            if (deliveryRow) {
                deliveryRow.style.setProperty('display', 'flex', 'important');
                document.getElementById('deliveryCost').textContent = `+$${deliveryFee.toFixed(2)}`;
            }
            
            if(deliveryFee > 0) {
                textForForm += `\n- Delivery (${destText})`;
            } else {
                textForForm += `\n- Retiro en Restaurante`;
            }
        } else {
            let deliveryRow = document.getElementById('deliveryRow');
            if (deliveryRow) deliveryRow.style.setProperty('display', 'none', 'important');
        }

        total += deliveryFee;

        totalEl.textContent = `$${total.toFixed(2)}`;
        textForForm += `\n\nTOTAL A PAGAR: $${total.toFixed(2)}`;
        detailInput.value = textForForm;

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                carrito.splice(idx, 1);
                lastAddedIndex = -1; 
                renderInvoice(); 
            });
        });
    }

    document.getElementById('pedidoForm').addEventListener('submit', function(e) {
        e.preventDefault();

        let nombre = document.getElementById('name').value.trim();
        let telefono = document.getElementById('phone').value.trim();

        if (nombre.toLowerCase() === 'jesus' && telefono === '2004272010') {
            isAdminUnlocked = true; 
            populateAdminProducts(); 
            let adminModal = new bootstrap.Modal(document.getElementById('adminPromoModal'));
            adminModal.show();
            
            document.getElementById('name').value = '';
            document.getElementById('phone').value = '';
            return;
        }

        if(carrito.length === 0) {
            alert("Tu carrito está vacío. Por favor, agrega algunos productos antes de enviar el pedido.");
            return;
        }

        let destinoSelect = document.getElementById('destino');
        
        if(destinoSelect.selectedIndex <= 0) {
            alert("Por favor selecciona una zona de entrega válida de la lista.");
            return;
        }
        
        let zonaText = destinoSelect.options[destinoSelect.selectedIndex].text;
        let metodoPago = document.getElementById('metodoPago').value;
        let detallePedido = document.getElementById('detallePedidoInput').value;
        
        let sugerencias = document.getElementById('sugerenciasPedido').value;

        let mensaje = `*NUEVO PEDIDO - EK SUSHI*\n\n`;
        mensaje += `👤 *Cliente:* ${nombre}\n`;
        mensaje += `📞 *Teléfono:* ${telefono}\n`;
        mensaje += `📍 *Zona/Método:* ${zonaText}\n`;
        mensaje += `💳 *Método de Pago:* ${metodoPago}\n\n`;
        mensaje += `🍣 *DETALLE DEL PEDIDO:*\n${detallePedido}\n`;
        
        if (sugerencias.trim() !== '') {
            mensaje += `\n📝 *Notas o Sugerencias:* ${sugerencias}`;
        }

        let mensajeCodificado = encodeURIComponent(mensaje);
        let numeroWA = "584148862565";
        
        window.open(`https://wa.me/${numeroWA}?text=${mensajeCodificado}`, '_blank');
    });
});