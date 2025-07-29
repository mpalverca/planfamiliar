 // Variables globales
        let mapRiesgos, mapUbicaciones, mapResumen;
        let currentMarker = null;
        let puntosMapeados = [];
        let familiares = [];
        let mascotas = [];
        let vulnerabilidades = [];
        let riesgosSeleccionados = [];
        let infoFamilia = {};
        
        // Inicialización
        document.addEventListener('DOMContentLoaded', function() {
            initRiskMap();
            
            // Datos de ejemplo (pueden borrarse)
            familiares = [
                {
                    nombre: "Juan Pérez",
                    edad: 35,
                    sangre: "O+",
                    parentesco: "Padre",
                    discapacidad: "",
                    responsabilidad: "Cortar servicios básicos",
                    medicamentos: ""
                },
                {
                    nombre: "María Gómez",
                    edad: 8,
                    sangre: "A+",
                    parentesco: "Hija",
                    discapacidad: "Asma",
                    responsabilidad: "Llevar mochila personal",
                    medicamentos: "Inhalador - cada 4 horas si es necesario"
                }
            ];
            renderFamiliaTable();
            
            mascotas = [
                {
                    nombre: "Firulais",
                    especie: "Perro",
                    edad: 3,
                    carnet: "123-456-789",
                    esterilizado: "Sí",
                    notas: "Vacunas al día, necesita correa especial"
                }
            ];
            renderMascotasTable();
            
            vulnerabilidades = [
                {
                    espacio: "Toda la vivienda",
                    vulnerabilidades: "Estructura antigua sin refuerzo sísmico",
                    acciones: "Contratar evaluación estructural",
                    prioridad: "Alta"
                },
                {
                    espacio: "Cocina",
                    vulnerabilidades: "Cilindro de gas sin sujeción",
                    acciones: "Instalar abrazadera para cilindro",
                    prioridad: "Alta"
                }
            ];
            renderVulnerabilidadTable();
        });
        
        // Mapa de riesgos
        function initRiskMap() {
            mapRiesgos = L.map('map-riesgos').setView([-0.2295, -78.5249], 6);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapRiesgos);
            
            // Capa de ejemplo con zonas de riesgo (en producción usar datos reales)
            const zonasRiesgo = [
                {
                    coords: [[-0.25, -78.55], [-0.20, -78.50], [-0.22, -78.45]],
                    tipo: "sismo",
                    nombre: "Zona sísmica alta"
                },
                {
                    coords: [[-0.15, -78.48], [-0.10, -78.45], [-0.12, -78.40]],
                    tipo: "inundacion",
                    nombre: "Zona inundable"
                }
            ];
            
            zonasRiesgo.forEach(zona => {
                const polygon = L.polygon(zona.coords, {
                    color: getColorForRisk(zona.tipo),
                    fillOpacity: 0.3
                }).addTo(mapRiesgos)
                .bindPopup(`<b>${zona.nombre}</b>`);
            });
        }
        function getColorForRisk(tipo) {
            const colors = {
                'sismo': '#ff0000',
                'inundacion': '#0000ff',
                'volcan': '#8b4513',
                'deslizamiento': '#a0522d',
                'incendio': '#ff4500',
                'sequia': '#ff8c00',
                'tsunami': '#1e90ff'
            };
            return colors[tipo] || '#333';
        }
        
        // Navegación entre pasos
        function siguientePaso(pasoActual) {
            // Guardar datos del paso actual
            if (pasoActual === 0) {
                infoFamilia = {
                    apellidos: document.getElementById('apellidos-familia').value,
                    direccion: document.getElementById('direccion-familia').value,
                    telefonoCelular: document.getElementById('telefono-celular').value,
                    telefonoConvencional: document.getElementById('telefono-convencional').value,
                    ubicacion: document.getElementById('ubicacion-familia').value
                };
            }
            
            document.getElementById(`paso${pasoActual}`).classList.add('hidden');
            document.getElementById(`paso${pasoActual + 1}`).classList.remove('hidden');
            
            // Inicializar mapas cuando se muestran
            if (pasoActual === 1) initUbicacionesMap();
            if (pasoActual === 6) generarResumen();
        }
        
        // Mapa de ubicaciones
        function initUbicacionesMap() {
            mapUbicaciones = L.map('map-ubicaciones').setView([-0.2295, -78.5249], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapUbicaciones);
            
            mapUbicaciones.on('click', function(e) {
                if (currentMarker) mapUbicaciones.removeLayer(currentMarker);
                
                currentMarker = L.marker(e.latlng, {
                    draggable: true,
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: '📍',
                        iconSize: [30, 30]
                    })
                }).addTo(mapUbicaciones)
                .bindPopup("Nuevo punto a registrar").openPopup();
                
                document.getElementById('coordenadas-punto').value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
                
                // Mostrar formulario automáticamente
                mostrarFormularioPunto();
            });
        }
        
        // Funciones para puntos mapeados
        function mostrarFormularioPunto() {
            if (!currentMarker) {
                alert("Primero selecciona un punto en el mapa");
                return;
            }
            document.getElementById('form-punto').classList.remove('hidden');
        }
        
        function ocultarFormularioPunto() {
            document.getElementById('form-punto').classList.add('hidden');
            document.getElementById('tipo-punto').value = "";
            document.getElementById('nombre-punto').value = "";
            document.getElementById('telefono-punto').value = "";
            document.getElementById('direccion-punto').value = "";
        }
        
        function guardarPunto() {
            const tipo = document.getElementById('tipo-punto').value;
            const nombre = document.getElementById('nombre-punto').value;
            
            if (!tipo || !nombre) {
                alert("Debes completar al menos el tipo y nombre del punto");
                return;
            }
            
            const coords = document.getElementById('coordenadas-punto').value.split(', ');
            const punto = {
                tipo,
                nombre,
                telefono: document.getElementById('telefono-punto').value,
                direccion: document.getElementById('direccion-punto').value,
                lat: parseFloat(coords[0]),
                lng: parseFloat(coords[1]),
                icono: getIconForPointType(tipo)
            };
            
            puntosMapeados.push(punto);
            renderPuntosTable();
            ocultarFormularioPunto();
            
            // Cambiar icono del marcador
            currentMarker.setIcon(L.divIcon({
                className: 'saved-marker',
                html: punto.icono,
                iconSize: [30, 30]
            }));
            currentMarker.bindPopup(`<b>${punto.nombre}</b><br>${punto.tipo}`).openPopup();
        }
        
        function getIconForPointType(tipo) {
            const icons = {
                'vivienda': '🏠',
                'hospital': '🏥',
                'medico': '👨‍⚕️',
                'familiar': '👪',
                'seguro': '🛡️'
            };
            return icons[tipo] || '📍';
        }
        
        function renderPuntosTable() {
            const tbody = document.getElementById('puntos-body');
            tbody.innerHTML = '';
            
            puntosMapeados.forEach((punto, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${punto.tipo}</td>
                    <td>${punto.nombre}</td>
                    <td><button onclick="eliminarPunto(${index})" style="padding: 5px 10px; background-color: var(--color-danger);">✕</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        function eliminarPunto(index) {
            puntosMapeados.splice(index, 1);
            renderPuntosTable();
        }
        
        // Funciones para familiares
        function mostrarFormularioFamiliar() {
            document.getElementById('form-familiar').classList.remove('hidden');
        }
        
        function ocultarFormularioFamiliar() {
            document.getElementById('form-familiar').classList.add('hidden');
            document.getElementById('nombre-familiar').value = "";
            document.getElementById('edad-familiar').value = "";
            document.getElementById('sangre-familiar').value = "";
            document.getElementById('parentesco-familiar').value = "Padre";
            document.getElementById('discapacidad-familiar').value = "";
            document.getElementById('responsabilidad-familiar').value = "";
            document.getElementById('medicamentos-familiar').value = "";
        }
        
        function guardarFamiliar() {
            const nombre = document.getElementById('nombre-familiar').value;
            const edad = document.getElementById('edad-familiar').value;
            
            if (!nombre || !edad) {
                alert("Debes completar al menos el nombre y edad");
                return;
            }
            
            const familiar = {
                nombre,
                edad: parseInt(edad),
                sangre: document.getElementById('sangre-familiar').value,
                parentesco: document.getElementById('parentesco-familiar').value,
                discapacidad: document.getElementById('discapacidad-familiar').value,
                responsabilidad: document.getElementById('responsabilidad-familiar').value,
                medicamentos: document.getElementById('medicamentos-familiar').value
            };
            
            familiares.push(familiar);
            renderFamiliaTable();
            ocultarFormularioFamiliar();
        }
        
        function renderFamiliaTable() {
            const tbody = document.getElementById('familia-body');
            tbody.innerHTML = '';
            
            familiares.forEach((familiar, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${familiar.nombre}</td>
                    <td>${familiar.edad}</td>
                    <td>${familiar.sangre || '-'}</td>
                    <td>${familiar.parentesco}</td>
                    <td>${familiar.discapacidad || '-'}</td>
                    <td>${familiar.responsabilidad || '-'}</td>
                    <td>${familiar.medicamentos || '-'}</td>
                    <td>
                        <button onclick="editarFamiliar(${index})" style="padding: 5px 10px; margin-right: 5px;">✏️</button>
                        <button onclick="eliminarFamiliar(${index})" style="padding: 5px 10px; background-color: var(--color-danger);">✕</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        function editarFamiliar(index) {
            const familiar = familiares[index];
            document.getElementById('nombre-familiar').value = familiar.nombre;
            document.getElementById('edad-familiar').value = familiar.edad;
            document.getElementById('sangre-familiar').value = familiar.sangre;
            document.getElementById('parentesco-familiar').value = familiar.parentesco;
            document.getElementById('discapacidad-familiar').value = familiar.discapacidad;
            document.getElementById('responsabilidad-familiar').value = familiar.responsabilidad;
            document.getElementById('medicamentos-familiar').value = familiar.medicamentos;
            
            // Eliminar el familiar existente si se guarda
            familiares.splice(index, 1);
            
            mostrarFormularioFamiliar();
        }
        
        function eliminarFamiliar(index) {
            if (confirm("¿Estás seguro de eliminar este integrante familiar?")) {
                familiares.splice(index, 1);
                renderFamiliaTable();
            }
        }
        
        // Funciones para mascotas
        function mostrarFormularioMascota() {
            document.getElementById('form-mascota').classList.remove('hidden');
        }
        
        function ocultarFormularioMascota() {
            document.getElementById('form-mascota').classList.add('hidden');
            document.getElementById('nombre-mascota').value = "";
            document.getElementById('especie-mascota').value = "Perro";
            document.getElementById('edad-mascota').value = "";
            document.getElementById('carnet-mascota').value = "";
            document.querySelector('input[name="esterilizado"][value="No"]').checked = true;
            document.getElementById('notas-mascota').value = "";
        }
        
        function guardarMascota() {
            const nombre = document.getElementById('nombre-mascota').value;
            const especie = document.getElementById('especie-mascota').value;
            const edad = document.getElementById('edad-mascota').value;
            
            if (!nombre || !especie || !edad) {
                alert("Debes completar al menos el nombre, especie y edad");
                return;
            }
            
            const mascota = {
                nombre,
                especie,
                edad: parseInt(edad),
                carnet: document.getElementById('carnet-mascota').value,
                esterilizado: document.querySelector('input[name="esterilizado"]:checked').value,
                notas: document.getElementById('notas-mascota').value
            };
            
            mascotas.push(mascota);
            renderMascotasTable();
            ocultarFormularioMascota();
        }
        
        function renderMascotasTable() {
            const tbody = document.getElementById('mascotas-body');
            tbody.innerHTML = '';
            
            mascotas.forEach((mascota, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${mascota.nombre}</td>
                    <td>${mascota.especie}</td>
                    <td>${mascota.edad}</td>
                    <td>${mascota.carnet || '-'}</td>
                    <td>${mascota.esterilizado}</td>
                    <td>
                        <button onclick="editarMascota(${index})" style="padding: 5px 10px; margin-right: 5px;">✏️</button>
                        <button onclick="eliminarMascota(${index})" style="padding: 5px 10px; background-color: var(--color-danger);">✕</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        function editarMascota(index) {
            const mascota = mascotas[index];
            document.getElementById('nombre-mascota').value = mascota.nombre;
            document.getElementById('especie-mascota').value = mascota.especie;
            document.getElementById('edad-mascota').value = mascota.edad;
            document.getElementById('carnet-mascota').value = mascota.carnet || "";
            document.querySelector(`input[name="esterilizado"][value="${mascota.esterilizado}"]`).checked = true;
            document.getElementById('notas-mascota').value = mascota.notas || "";
            
            // Eliminar la mascota existente si se guarda
            mascotas.splice(index, 1);
            
            mostrarFormularioMascota();
        }
        
        function eliminarMascota(index) {
            if (confirm("¿Estás seguro de eliminar esta mascota?")) {
                mascotas.splice(index, 1);
                renderMascotasTable();
            }
        }
        
        // Funciones para vulnerabilidad
        function mostrarFormularioVulnerabilidad() {
            document.getElementById('form-vulnerabilidad').classList.remove('hidden');
        }
        
        function ocultarFormularioVulnerabilidad() {
            document.getElementById('form-vulnerabilidad').classList.add('hidden');
            document.getElementById('espacio-vulnerabilidad').value = "Toda la vivienda";
            document.getElementById('vulnerabilidades').value = "";
            document.getElementById('acciones-vulnerabilidad').value = "";
            document.getElementById('prioridad-vulnerabilidad').value = "Alta";
        }
        
        function guardarVulnerabilidad() {
            const espacio = document.getElementById('espacio-vulnerabilidad').value;
            const vulnerabilidadesText = document.getElementById('vulnerabilidades').value;
            
            if (!espacio || !vulnerabilidadesText) {
                alert("Debes completar al menos el espacio y vulnerabilidades");
                return;
            }
            
            const vulnerabilidad = {
                espacio,
                vulnerabilidades: vulnerabilidadesText,
                acciones: document.getElementById('acciones-vulnerabilidad').value,
                prioridad: document.getElementById('prioridad-vulnerabilidad').value
            };
            
            vulnerabilidades.push(vulnerabilidad);
            renderVulnerabilidadTable();
            ocultarFormularioVulnerabilidad();
        }
        
        function renderVulnerabilidadTable() {
            const tbody = document.getElementById('vulnerabilidad-body');
            tbody.innerHTML = '';
            
            vulnerabilidades.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.espacio}</td>
                    <td>${item.vulnerabilidades}</td>
                    <td>${item.acciones}</td>
                    <td>${item.prioridad}</td>
                    <td>
                        <button onclick="editarVulnerabilidad(${index})" style="padding: 5px 10px; margin-right: 5px;">✏️</button>
                        <button onclick="eliminarVulnerabilidad(${index})" style="padding: 5px 10px; background-color: var(--color-danger);">✕</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        function editarVulnerabilidad(index) {
            const item = vulnerabilidades[index];
            document.getElementById('espacio-vulnerabilidad').value = item.espacio;
            document.getElementById('vulnerabilidades').value = item.vulnerabilidades;
            document.getElementById('acciones-vulnerabilidad').value = item.acciones;
            document.getElementById('prioridad-vulnerabilidad').value = item.prioridad;
            
            // Eliminar el item existente si se guarda
            vulnerabilidades.splice(index, 1);
            
            mostrarFormularioVulnerabilidad();
        }
        
        function eliminarVulnerabilidad(index) {
            if (confirm("¿Estás seguro de eliminar esta evaluación de vulnerabilidad?")) {
                vulnerabilidades.splice(index, 1);
                renderVulnerabilidadTable();
            }
        }
        
        // Funciones para riesgos
        function toggleRisk(element, riskType) {
            element.classList.toggle('selected');
            
            const index = riesgosSeleccionados.indexOf(riskType);
            if (index === -1) {
                riesgosSeleccionados.push(riskType);
            } else {
                riesgosSeleccionados.splice(index, 1);
            }
        }
        
        // Generar resumen final
        function generarResumen() {
            // Inicializar mapa de resumen
            mapResumen = L.map('map-resumen').setView([-0.2295, -78.5249], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapResumen);
            
            // Grupo de clusters
            const markersCluster = L.markerClusterGroup();
            
            // Agregar todos los puntos mapeados
            puntosMapeados.forEach(punto => {
                const marker = L.marker([punto.lat, punto.lng], {
                    icon: L.divIcon({
                        html: punto.icono,
                        iconSize: [30, 30],
                        className: 'resumen-marker'
                    })
                }).bindPopup(`
                    <b>${punto.nombre}</b><br>
                    <em>${punto.tipo}</em><br>
                    ${punto.telefono ? `Tel: ${punto.telefono}<br>` : ''}
                    ${punto.direccion || ''}
                `);
                markersCluster.addLayer(marker);
            });
            
            mapResumen.addLayer(markersCluster);
            
            // Generar resumen de información familiar
            const resumenFamilia = document.getElementById('resumen-familia');
            resumenFamilia.innerHTML = `
                <p><strong>Apellidos:</strong> ${infoFamilia.apellidos || 'No especificado'}</p>
                <p><strong>Dirección:</strong> ${infoFamilia.direccion || 'No especificado'}</p>
                <p><strong>Teléfono celular:</strong> ${infoFamilia.telefonoCelular || 'No especificado'}</p>
                <p><strong>Teléfono convencional:</strong> ${infoFamilia.telefonoConvencional || 'No especificado'}</p>
                <p><strong>Ubicación:</strong> ${infoFamilia.ubicacion || 'No especificado'}</p>
            `;
            
            // Generar resumen de integrantes
            const resumenIntegrantes = document.getElementById('resumen-integrantes');
            resumenIntegrantes.innerHTML = `
                <p><strong>Total integrantes:</strong> ${familiares.length}</p>
                <ul>
                    ${familiares.map(f => `
                        <li>
                            <strong>${f.nombre}</strong> (${f.edad} años, ${f.parentesco})<br>
                            ${f.discapacidad ? `<em>Condición especial: ${f.discapacidad}</em><br>` : ''}
                            ${f.medicamentos ? `<em>Medicamentos: ${f.medicamentos}</em><br>` : ''}
                            <small>Responsabilidad: ${f.responsabilidad || 'No asignada'}</small>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            // Generar resumen de mascotas
            const resumenMascotas = document.getElementById('resumen-mascotas');
            resumenMascotas.innerHTML = `
                <p><strong>Total mascotas:</strong> ${mascotas.length}</p>
                <ul>
                    ${mascotas.map(m => `
                        <li>
                            <strong>${m.nombre}</strong> (${m.especie}, ${m.edad} años)<br>
                            <em>Carnet: ${m.carnet || 'No registrado'}</em><br>
                            <em>Esterilizado: ${m.esterilizado}</em><br>
                            ${m.notas ? `<small>Notas: ${m.notas}</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            `;
            
            // Generar resumen de riesgos
            const resumenRiesgos = document.getElementById('resumen-riesgos');
            resumenRiesgos.innerHTML = `
                <p><strong>Riesgos identificados:</strong></p>
                <ul>
                    ${riesgosSeleccionados.map(riesgo => `<li>${getRiskName(riesgo)}</li>`).join('')}
                    ${document.getElementById('otros-riesgos').value ? 
                      `<li>Otros: ${document.getElementById('otros-riesgos').value}</li>` : ''}
                </ul>
            `;
            
            // Generar resumen de vulnerabilidad
            const resumenVulnerabilidad = document.getElementById('resumen-vulnerabilidad');
            resumenVulnerabilidad.innerHTML = `
                <p><strong>Áreas críticas:</strong></p>
                <ul>
                    ${vulnerabilidades.filter(v => v.prioridad === "Alta").map(v => `
                        <li>
                            <strong>${v.espacio}</strong><br>
                            ${v.vulnerabilidades}<br>
                            <em>Acciones: ${v.acciones}</em>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            // Generar resumen de mochila de emergencia
            const resumenMochila = document.getElementById('resumen-mochila');
            resumenMochila.innerHTML = `
                <p><strong>Elementos esenciales:</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <h4>Varios</h4>
                        <ul>
                            <li>${document.getElementById('item-linterna').checked ? '✓' : '✗'} Linterna</li>
                            <li>${document.getElementById('item-pilas').checked ? '✓' : '✗'} Pilas extras</li>
                            <li>${document.getElementById('item-velas').checked ? '✓' : '✗'} Velas y fósforos</li>
                            <li>${document.getElementById('item-mantas').checked ? '✓' : '✗'} Mantas</li>
                            <li>${document.getElementById('item-silbato').checked ? '✓' : '✗'} Silbato</li>
                            <li>${document.getElementById('item-alimentos').checked ? '✓' : '✗'} Alimentos no perecibles</li>
                            <li>${document.getElementById('item-agua').checked ? '✓' : '✗'} Agua embotellada</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Botiquín</h4>
                        <ul>
                            <li>${document.getElementById('item-guantes').checked ? '✓' : '✗'} Guantes de látex</li>
                            <li>${document.getElementById('item-gasas').checked ? '✓' : '✗'} Gasas</li>
                            <li>${document.getElementById('item-tijeras').checked ? '✓' : '✗'} Tijeras</li>
                            <li>${document.getElementById('item-vendas').checked ? '✓' : '✗'} Vendas</li>
                            <li>${document.getElementById('item-mascarillas').checked ? '✓' : '✗'} Mascarillas</li>
                            <li>${document.getElementById('item-medicamentos').checked ? '✓' : '✗'} Medicamentos</li>
                        </ul>
                    </div>
                </div>
                ${document.getElementById('otros-elementos').value ? `
                <p><strong>Otros elementos importantes:</strong></p>
                <p>${document.getElementById('otros-elementos').value}</p>
                ` : ''}
            `;
        }
        
        function getRiskName(riskType) {
            const names = {
                'sismo': 'Sismos/Terremotos',
                'inundacion': 'Inundaciones',
                'volcan': 'Actividad Volcánica',
                'deslizamiento': 'Movimiento de Ladera',
                'incendio': 'Incendios Forestales',
                'sequia': 'Sequía',
                'tsunami': 'Tsunami'
            };
            return names[riskType] || riskType;
        }
        
        // Guardar plan completo
        function guardarPlanCompleto() {
            const planCompleto = {
                infoFamilia,
                riesgos: riesgosSeleccionados,
                otrosRiesgos: document.getElementById('otros-riesgos').value,
                puntosMapeados,
                familiares,
                mascotas,
                vulnerabilidades,
                mochila: {
                    varios: {
                        linterna: document.getElementById('item-linterna').checked,
                        pilas: document.getElementById('item-pilas').checked,
                        velas: document.getElementById('item-velas').checked,
                        mantas: document.getElementById('item-mantas').checked,
                        silbato: document.getElementById('item-silbato').checked,
                        alimentos: document.getElementById('item-alimentos').checked,
                        agua: document.getElementById('item-agua').checked,
                        ropa: document.getElementById('item-ropa').checked,
                        documentos: document.getElementById('item-documentos').checked,
                        contactos: document.getElementById('item-contactos').checked,
                        impermeables: document.getElementById('item-impermeables').checked,
                        mascota: document.getElementById('item-mascota').checked,
                        radio: document.getElementById('item-radio').checked
                    },
                    aseo: {
                        jabon: document.getElementById('item-jabon').checked,
                        pasta: document.getElementById('item-pasta').checked,
                        papel: document.getElementById('item-papel').checked,
                        gel: document.getElementById('item-gel').checked,
                        toallas: document.getElementById('item-toallas').checked,
                        preservativos: document.getElementById('item-preservativos').checked,
                        champu: document.getElementById('item-champu').checked,
                        cepillo: document.getElementById('item-cepillo').checked
                    },
                    botiquin: {
                        guantes: document.getElementById('item-guantes').checked,
                        gasas: document.getElementById('item-gasas').checked,
                        tijeras: document.getElementById('item-tijeras').checked,
                        esparadrapo: document.getElementById('item-esparadrapo').checked,
                        vendas: document.getElementById('item-vendas').checked,
                        mascarillas: document.getElementById('item-mascarillas').checked,
                        curitas: document.getElementById('item-curitas').checked,
                        gafas: document.getElementById('item-gafas').checked,
                        jabonAntiseptico: document.getElementById('item-jabon-antiseptico').checked,
                        medicamentos: document.getElementById('item-medicamentos').checked
                    },
                    otros: document.getElementById('otros-elementos').value
                },
                fecha: new Date().toLocaleString('es-EC', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            
            // Simulación de guardado (en producción usar Supabase)
            localStorage.setItem('planFamiliarCompleto', JSON.stringify(planCompleto));
            alert('✅ Plan familiar guardado exitosamente');
            
            /* 
            // Código para Supabase:
            supabase.from('planes_familiares').insert([{
                info_familia: infoFamilia,
                riesgos: riesgosSeleccionados,
                otros_riesgos: document.getElementById('otros-riesgos').value,
                puntos_mapeados: puntosMapeados,
                integrantes: familiares,
                mascotas,
                vulnerabilidades,
                mochila: planCompleto.mochila,
                user_id: 'usuario_actual' // Reemplazar con autenticación
            }]);
            */
        }