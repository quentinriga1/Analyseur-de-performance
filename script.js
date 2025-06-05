let vendeurs = [];
let clientsChart, pointsChart, pointsParClientChart; // NEW: Added pointsParClientChart

function ajouterVendeur() {
    const nom = document.getElementById('vendeurNom').value.trim();
    const joursEffectifs = parseInt(document.getElementById('joursEffectifs').value) || 0;
    const modeCalcul = document.getElementById('modeCalcul').value;
    const joursAbsence = parseInt(document.getElementById('joursAbsence').value) || 0;
    const tauxProductivite = parseFloat(document.getElementById('tauxProductivite').value) || 100;
    const totalClients = parseInt(document.getElementById('totalClients').value) || 0;
    const totalPoints = parseInt(document.getElementById('totalPoints').value) || 0;

    if (!nom || joursEffectifs <= 0) {
        alert('Veuillez remplir tous les champs obligatoires (nom et jours effectifs).');
        return;
    }

    let joursReelsTravaill;
    if (modeCalcul === 'productivite') {
        joursReelsTravaill = Math.max(1, joursEffectifs * (tauxProductivite / 100));
    } else {
        joursReelsTravaill = Math.max(1, joursEffectifs - joursAbsence);
    }
    const clientsParJour = (totalClients / joursReelsTravaill).toFixed(2);
    const pointsParJour = (totalPoints / joursReelsTravaill).toFixed(2);
    // NEW: Calculate points par client
    const pointsParClient = (totalClients > 0) ? (totalPoints / totalClients).toFixed(2) : 0;


    const vendeur = {
        nom,
        joursEffectifs,
        joursAbsence,
        tauxProductivite,
        modeCalcul,
        joursReelsTravaill,
        totalClients,
        totalPoints,
        clientsParJour: parseFloat(clientsParJour),
        pointsParJour: parseFloat(pointsParJour),
        pointsParClient: parseFloat(pointsParClient) // NEW: Store pointsParClient
    };

    vendeurs.push(vendeur);
    
    document.getElementById('vendeurNom').value = '';
    document.getElementById('joursEffectifs').value = '';
    document.getElementById('joursAbsence').value = '0';
    document.getElementById('tauxProductivite').value = '100';
    document.getElementById('totalClients').value = '';
    document.getElementById('totalPoints').value = '';

    changerModeCalcul();
    mettreAJourAffichage();
}

function supprimerVendeur(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce vendeur ?')) {
        vendeurs.splice(index, 1);
        mettreAJourAffichage();
    }
}

function getPerformanceClass(valeur, moyenne) {
    if (moyenne === 0 && valeur === 0) return 'average'; // Handle case where average is 0
    if (moyenne === 0 && valeur > 0) return 'above-average';
    if (valeur > moyenne) return 'above-average';
    if (valeur < moyenne) return 'below-average';
    return 'average';
}

function mettreAJourAffichage() {
    mettreAJourTableau();
    mettreAJourGraphiques();
    mettreAJourStats();
}

function mettreAJourTableau() {
    const container = document.getElementById('tableauVendeurs');
    
    if (vendeurs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun vendeur ajouté pour le moment.</p>';
        // NEW: Ensure charts are cleared if no sellers
        if (clientsChart) clientsChart.destroy();
        if (pointsChart) pointsChart.destroy();
        if (pointsParClientChart) pointsParClientChart.destroy();
        clientsChart = null;
        pointsChart = null;
        pointsParClientChart = null;
        // Clear chart canvases if needed by drawing empty state or hiding them
        document.getElementById('clientsChart').getContext('2d').clearRect(0, 0, document.getElementById('clientsChart').width, document.getElementById('clientsChart').height);
        document.getElementById('pointsChart').getContext('2d').clearRect(0, 0, document.getElementById('pointsChart').width, document.getElementById('pointsChart').height);
        document.getElementById('pointsParClientChart').getContext('2d').clearRect(0, 0, document.getElementById('pointsParClientChart').width, document.getElementById('pointsParClientChart').height);
        return;
    }

    const moyenneClientsJour = vendeurs.reduce((sum, v) => sum + v.clientsParJour, 0) / vendeurs.length;
    const moyennePointsJour = vendeurs.reduce((sum, v) => sum + v.pointsParJour, 0) / vendeurs.length;
    // NEW: Calculate average points per client for the team
    const moyennePointsParClient = vendeurs.reduce((sum, v) => sum + v.pointsParClient, 0) / vendeurs.length;


    const headerAbsence = vendeurs.some(v => v.modeCalcul === 'productivite') ? 'Productivité (%)' : 'Jours Absence';

    let html = `
        <div style="background: #e8f4f8; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #2c3e50;">📊 Moyennes de l'Équipe</h3>
            <p style="margin: 10px 0 0 0; color: #34495e;">
                <strong>Clients/Jour :</strong> ${moyenneClientsJour.toFixed(2)} |
                <strong>Points/Jour :</strong> ${moyennePointsJour.toFixed(0)} |
                <strong>Points/Client :</strong> ${moyennePointsParClient.toFixed(2)} </p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Vendeur</th>
                    <th>Jours Effectifs</th>
                    <th id="colAbsence">${headerAbsence}</th>
                    <th>Jours Réels</th>
                    <th>Total Clients</th>
                    <th>Total Points</th>
                    <th>Clients/Jour</th>
                    <th>Points/Jour</th>
                    <th>Points/Client</th> <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    vendeurs.forEach((vendeur, index) => {
        const clientsClass = getPerformanceClass(vendeur.clientsParJour, moyenneClientsJour);
        const pointsClass = getPerformanceClass(vendeur.pointsParJour, moyennePointsJour);
        const pointsParClientClass = getPerformanceClass(vendeur.pointsParClient, moyennePointsParClient); // NEW
        
        html += `
            <tr>
                <td><strong>${vendeur.nom}</strong></td>
                <td>${vendeur.joursEffectifs}</td>
                <td>${vendeur.modeCalcul === 'productivite' ? vendeur.tauxProductivite + '%' : vendeur.joursAbsence}</td>
                <td>${vendeur.joursReelsTravaill}</td>
                <td>${vendeur.totalClients}</td>
                <td>${vendeur.totalPoints}</td>
                <td><span class="performance-cell ${clientsClass}">${vendeur.clientsParJour.toFixed(2)}</span></td>
                <td><span class="performance-cell ${pointsClass}">${vendeur.pointsParJour.toFixed(2)}</span></td>
                <td><span class="performance-cell ${pointsParClientClass}">${vendeur.pointsParClient.toFixed(2)}</span></td> <td><button class="btn btn-danger" onclick="supprimerVendeur(${index})">Supprimer</button></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function mettreAJourGraphiques() {
    if (vendeurs.length === 0) {
         // Handled in mettreAJourTableau now for clearing charts
        return;
    }

    const noms = vendeurs.map(v => v.nom);
    const clientsData = vendeurs.map(v => v.clientsParJour);
    const pointsData = vendeurs.map(v => v.pointsParJour);
    const pointsParClientData = vendeurs.map(v => v.pointsParClient); // NEW: Data for new chart

    // Graphique Clients
    const ctxClients = document.getElementById('clientsChart').getContext('2d');
    if (clientsChart) clientsChart.destroy();
    
    clientsChart = new Chart(ctxClients, {
        type: 'bar',
        data: {
            labels: noms,
            datasets: [{
                label: 'Clients par Jour',
                data: clientsData,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Clients Servis par Jour',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Clients/Jour'
                    }
                }
            }
        }
    });

    // Graphique Points
    const ctxPoints = document.getElementById('pointsChart').getContext('2d');
    if (pointsChart) pointsChart.destroy();
    
    pointsChart = new Chart(ctxPoints, {
        type: 'bar',
        data: {
            labels: noms,
            datasets: [{
                label: 'Points par Jour',
                data: pointsData,
                backgroundColor: 'rgba(118, 75, 162, 0.8)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Points Réalisés par Jour',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Points/Jour'
                    }
                }
            }
        }
    });

    // NEW: Graphique Points par Client
    const ctxPointsParClient = document.getElementById('pointsParClientChart').getContext('2d');
    if (pointsParClientChart) pointsParClientChart.destroy();
    
    pointsParClientChart = new Chart(ctxPointsParClient, {
        type: 'bar',
        data: {
            labels: noms,
            datasets: [{
                label: 'Points par Client',
                data: pointsParClientData,
                backgroundColor: 'rgba(75, 192, 192, 0.8)', // Different color
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Moyenne Points par Client',
                    font: { size: 16, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Points/Client'
                    }
                }
            }
        }
    });
}

function mettreAJourStats() {
    const totalVendeurs = vendeurs.length;
    const moyenneClients = vendeurs.length > 0 ? 
        (vendeurs.reduce((sum, v) => sum + v.clientsParJour, 0) / vendeurs.length).toFixed(1) : 0;
    const moyennePoints = vendeurs.length > 0 ? 
        (vendeurs.reduce((sum, v) => sum + v.pointsParJour, 0) / vendeurs.length).toFixed(0) : 0;
    
    let meilleurPerformeur = '-';
    let meilleurPointsJour = '-';
    let meilleurPointsClient = '-';
    if (vendeurs.length > 0) {
        const meilleur = [...vendeurs].sort((a,b) => b.clientsParJour - a.clientsParJour)[0];
        meilleurPerformeur = meilleur.nom;

        const bestPointsJour = [...vendeurs].sort((a,b) => b.pointsParJour - a.pointsParJour)[0];
        meilleurPointsJour = bestPointsJour.nom;

        const bestPointsClient = [...vendeurs].sort((a,b) => b.pointsParClient - a.pointsParClient)[0];
        meilleurPointsClient = bestPointsClient.nom;
    }

    document.getElementById('totalVendeurs').textContent = totalVendeurs;
    document.getElementById('moyenneClients').textContent = moyenneClients;
    document.getElementById('moyennePoints').textContent = moyennePoints;
    document.getElementById('meilleurPerformeur').textContent = meilleurPerformeur;
    document.getElementById('meilleurPointsJour').textContent = meilleurPointsJour;
    document.getElementById('meilleurPointsClient').textContent = meilleurPointsClient;
}

function exporterDonnees() {
    if (vendeurs.length === 0) {
        alert('Aucune donnée à exporter.');
        return;
    }

    const moyenneClientsJour = vendeurs.reduce((sum, v) => sum + v.clientsParJour, 0) / vendeurs.length;
    const moyennePointsJour = vendeurs.reduce((sum, v) => sum + v.pointsParJour, 0) / vendeurs.length;
    const moyennePointsParClient = vendeurs.reduce((sum, v) => sum + v.pointsParClient, 0) / vendeurs.length; // NEW

    const headerAbsence = vendeurs.some(v => v.modeCalcul === 'productivite') ? 'Productivité (%)' : 'Jours Absence';

    const donneesExport = [
        ['ANALYSE DE PERFORMANCE - EQUIPE DE VENTE'],
        ['Date d\'export:', new Date().toLocaleDateString('fr-FR')],
        [''],
        ['MOYENNES DE L\'EQUIPE'],
        ['Moyenne Clients/Jour:', moyenneClientsJour.toFixed(2)],
        ['Moyenne Points/Jour:', moyennePointsJour.toFixed(0)],
        ['Moyenne Points/Client:', moyennePointsParClient.toFixed(2)], // NEW
        [''],
        ['DONNEES DETAILLEES'],
        // MODIFIED: Added Points/Client and its performance column
        ['Vendeur', 'Jours Effectifs', headerAbsence, 'Jours Réels', 'Total Clients', 'Total Points', 'Clients/Jour', 'Points/Jour', 'Points/Client', 'Performance Clients/Jour', 'Performance Points/Jour', 'Performance Points/Client']
    ];

    vendeurs.forEach(vendeur => {
        const perfClientsJour = vendeur.clientsParJour > moyenneClientsJour ? 'AU-DESSUS' : 
                          vendeur.clientsParJour < moyenneClientsJour ? 'EN-DESSOUS' : 'MOYENNE';
        const perfPointsJour = vendeur.pointsParJour > moyennePointsJour ? 'AU-DESSUS' : 
                         vendeur.pointsParJour < moyennePointsJour ? 'EN-DESSOUS' : 'MOYENNE';
        const perfPointsParClient = vendeur.pointsParClient > moyennePointsParClient ? 'AU-DESSUS' :
                             vendeur.pointsParClient < moyennePointsParClient ? 'EN-DESSOUS' : 'MOYENNE'; // NEW
        
        donneesExport.push([
            vendeur.nom,
            vendeur.joursEffectifs,
            vendeur.modeCalcul === 'productivite' ? vendeur.tauxProductivite + '%' : vendeur.joursAbsence,
            vendeur.joursReelsTravaill,
            vendeur.totalClients,
            vendeur.totalPoints,
            vendeur.clientsParJour.toFixed(2),
            vendeur.pointsParJour.toFixed(2),
            vendeur.pointsParClient.toFixed(2), // NEW
            perfClientsJour,
            perfPointsJour,
            perfPointsParClient // NEW
        ]);
    });

    donneesExport.push([]);
    donneesExport.push(['CLASSEMENT PAR CLIENTS/JOUR']);
    const vendeursTriesClientsJour = [...vendeurs].sort((a, b) => b.clientsParJour - a.clientsParJour);
    vendeursTriesClientsJour.forEach((vendeur, index) => {
        donneesExport.push([`${index + 1}. ${vendeur.nom}`, vendeur.clientsParJour.toFixed(2)]);
    });

    donneesExport.push([]);
    donneesExport.push(['CLASSEMENT PAR POINTS/JOUR']);
    const vendeursTriesPointsJour = [...vendeurs].sort((a, b) => b.pointsParJour - a.pointsParJour);
    vendeursTriesPointsJour.forEach((vendeur, index) => {
        donneesExport.push([`${index + 1}. ${vendeur.nom}`, vendeur.pointsParJour.toFixed(2)]);
    });
    
    // NEW: Ranking by Points/Client
    donneesExport.push([]);
    donneesExport.push(['CLASSEMENT PAR POINTS/CLIENT']);
    const vendeursTriesPointsClient = [...vendeurs].sort((a, b) => b.pointsParClient - a.pointsParClient);
    vendeursTriesPointsClient.forEach((vendeur, index) => {
        donneesExport.push([`${index + 1}. ${vendeur.nom}`, vendeur.pointsParClient.toFixed(2)]);
    });


    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(donneesExport);

    // MODIFIED: Adjusted column widths for new columns
    ws['!cols'] = [
        {width: 20}, {width: 15}, {width: 15}, {width: 12}, 
        {width: 15}, {width: 15}, {width: 15}, {width: 15}, 
        {width: 15}, {width: 20}, {width: 20}, {width: 22} // Added width for Points/Client and its perf
    ];
    
    const headerRowIndexDetailedData = 8; // Row index for 'DONNEES DETAILLEES' headers
    const firstDataRowIndex = headerRowIndexDetailedData + 1;

    // Styliser les cellules importantes
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 0; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
            const cell_address = {c: C, r: R};
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            
            if (!ws[cell_ref]) continue;
            
            // Styliser les titres et en-têtes principaux
             if (R === 0 || R === 3 || R === headerRowIndexDetailedData -1 ||
                (R === headerRowIndexDetailedData && ws[cell_ref].v !== '') ||
                ws[cell_ref].v === 'CLASSEMENT PAR CLIENTS/JOUR' ||
                ws[cell_ref].v === 'CLASSEMENT PAR POINTS/JOUR' ||
                ws[cell_ref].v === 'CLASSEMENT PAR POINTS/CLIENT' ) { // NEW: Ranking title
                ws[cell_ref].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4472C4" } },
                    alignment: { horizontal: "center" }
                };
            }
            
            // Colorier selon les performances (lignes de données)
            if (R >= firstDataRowIndex && R < firstDataRowIndex + vendeurs.length) {
                const vendeurIndex = R - firstDataRowIndex;
                const vendeur = vendeurs[vendeurIndex];
                
                // Colonne Clients/Jour (G, index 6)
                if (C === 6) { 
                    if (vendeur.clientsParJour > moyenneClientsJour) ws[cell_ref].s = { fill: { fgColor: { rgb: "D4EDDA" } } };
                    else if (vendeur.clientsParJour < moyenneClientsJour) ws[cell_ref].s = { fill: { fgColor: { rgb: "F8D7DA" } } };
                }
                // Colonne Points/Jour (H, index 7)
                if (C === 7) {
                    if (vendeur.pointsParJour > moyennePointsJour) ws[cell_ref].s = { fill: { fgColor: { rgb: "D4EDDA" } } };
                    else if (vendeur.pointsParJour < moyennePointsJour) ws[cell_ref].s = { fill: { fgColor: { rgb: "F8D7DA" } } };
                }
                // NEW: Colonne Points/Client (I, index 8)
                 if (C === 8) {
                    if (vendeur.pointsParClient > moyennePointsParClient) ws[cell_ref].s = { fill: { fgColor: { rgb: "D4EDDA" } } };
                    else if (vendeur.pointsParClient < moyennePointsParClient && vendeur.totalClients > 0) ws[cell_ref].s = { fill: { fgColor: { rgb: "F8D7DA" } } };
                    // else if (vendeur.totalClients === 0) {} // No specific color if 0 clients
                }
            }
        }
    }


    XLSX.utils.book_append_sheet(wb, ws, "Performance Équipe");
    
    const fileName = `Performance_Equipe_Vente_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert('✅ Fichier Excel exporté avec succès !\n\n' +
          '🟢 Vert = Au-dessus de la moyenne\n' +
          '🔴 Rouge = En-dessous de la moyenne\n' +
          'Le fichier inclut les moyennes, classements et analyses comparatives.');
}

function viderDonnees() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ?')) {
        vendeurs = [];
        mettreAJourAffichage(); // This will clear table, graphs, stats
    }
}

function changerModeCalcul() {
    const mode = document.getElementById('modeCalcul').value;
    document.getElementById('groupeAbsences').style.display = mode === 'absences' ? 'flex' : 'none';
    document.getElementById('groupeProductivite').style.display = mode === 'productivite' ? 'flex' : 'none';
}

function exporterCapture() {
    if (vendeurs.length === 0) {
        alert('Aucune donnée à capturer. Ajoutez d\'abord des vendeurs.');
        return;
    }

    const maintenant = new Date();
    const dateFormatee = maintenant.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('reportDate').textContent = `Généré le ${dateFormatee}`;

    const boutonCapture = event.target;
    const texteOriginal = boutonCapture.textContent;
    boutonCapture.textContent = '⏳ Génération en cours...';
    boutonCapture.disabled = true;

    setTimeout(() => {
        html2canvas(document.getElementById('exportZone'), {
            backgroundColor: '#ffffff',
            scale: 2, 
            useCORS: true,
            allowTaint: false,
            width: document.getElementById('exportZone').scrollWidth,
            height: document.getElementById('exportZone').scrollHeight,
            scrollX: 0,
            scrollY: 0
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Rapport_Performance_Equipe_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            boutonCapture.textContent = texteOriginal;
            boutonCapture.disabled = false;
            
            alert('✅ Capture d\'écran exportée avec succès !\n\n' +
                  '📸 L\'image inclut :\n' +
                  '• Tableau des performances avec codes couleur\n' +
                  '• Graphiques de comparaison (y compris Points/Client)\n' + // MODIFIED
                  '• Statistiques globales\n' +
                  '• Date et heure de génération');
                  
        }).catch(error => {
            console.error('Erreur lors de la capture:', error);
            boutonCapture.textContent = texteOriginal;
            boutonCapture.disabled = false;
            alert('❌ Erreur lors de la génération de la capture d\'écran.\nVeuillez réessayer.');
        });
    }, 500); // Increased timeout slightly for potentially more complex rendering
}

// Initial call to set up the view if needed, though it's mostly event-driven
document.addEventListener('DOMContentLoaded', () => {
    changerModeCalcul();
    mettreAJourAffichage(); // To set the initial empty state correctly
});
