document.addEventListener('DOMContentLoaded', () => {
    const rolesContainer = document.querySelector('.roles-container');
    const saveButton = document.getElementById('save-button');
    const loadInput = document.getElementById('load-input');

    // --- Functies voor UI-manipulatie ---

    function createExperimentElement(experiment, roleName) {
        const newExperimentItem = document.createElement('div');
        newExperimentItem.classList.add('experiment-item');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('experiment-item-content');

        if (experiment.url && experiment.url.trim() !== '') {
            const link = document.createElement('a');
            link.href = experiment.url.trim();
            link.textContent = experiment.name.trim();
            link.target = '_blank';
            contentDiv.appendChild(link);
        } else {
            const span = document.createElement('span');
            span.textContent = experiment.name.trim();
            contentDiv.appendChild(span);
        }
        newExperimentItem.appendChild(contentDiv);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-experiment-button');
        deleteButton.textContent = 'X';
        // Listener wordt later toegevoegd door addEventListeners
        newExperimentItem.appendChild(deleteButton);

        return newExperimentItem;
    }

    function rebuildUI(data) {
        rolesContainer.innerHTML = ''; // Maak de container leeg

        data.forEach(roleData => {
            const roleColumn = document.createElement('div');
            roleColumn.classList.add('role-column');

            const roleButton = document.createElement('button');
            roleButton.classList.add('role-button', roleData.role);
            // Hoofdletter aan begin van rolnaam voor weergave
            const roleDisplayName = roleData.role.charAt(0).toUpperCase() + roleData.role.slice(1);
            roleButton.textContent = roleDisplayName;
            roleColumn.appendChild(roleButton);

            const experimentsContainer = document.createElement('div');
            experimentsContainer.classList.add('experiments', `${roleData.role}-experiments`);

            roleData.experiments.forEach(exp => {
                const experimentElement = createExperimentElement(exp, roleData.role);
                experimentsContainer.appendChild(experimentElement);
            });

            const addExperimentButton = document.createElement('button');
            addExperimentButton.classList.add('add-experiment-button');
            addExperimentButton.setAttribute('data-role', roleData.role);
            addExperimentButton.textContent = '+ Experiment toevoegen';
            // Listener wordt later toegevoegd door addEventListeners
            experimentsContainer.appendChild(addExperimentButton);

            roleColumn.appendChild(experimentsContainer);
            rolesContainer.appendChild(roleColumn);
        });

        addEventListeners(); // Koppel alle listeners opnieuw na het herbouwen
    }

    // --- Event Handlers ---

    function handleAddExperiment(event) {
        const button = event.target;
        const role = button.getAttribute('data-role');
        const experimentName = prompt(`Voer de naam in voor het nieuwe experiment onder ${role}:`);

        if (experimentName && experimentName.trim() !== '') {
            const experimentUrl = prompt(`Voer de URL in voor '${experimentName.trim()}' (optioneel):`);
            const experimentsContainer = button.closest('.experiments'); // Nu .experiments pakken

            if (experimentsContainer) {
                const experimentData = {
                    name: experimentName.trim(),
                    url: (experimentUrl && experimentUrl.trim() !== '') ? experimentUrl.trim() : null
                };
                const newExperimentElement = createExperimentElement(experimentData, role);

                // Koppel de delete listener direct aan de nieuwe knop
                const deleteButton = newExperimentElement.querySelector('.delete-experiment-button');
                if (deleteButton) {
                    deleteButton.addEventListener('click', handleDeleteExperiment);
                }

                // Voeg het nieuwe experiment toe *voor* de 'toevoegen' knop
                experimentsContainer.insertBefore(newExperimentElement, button);
            }
        } else if (experimentName !== null) {
            alert('Experiment naam mag niet leeg zijn.');
        }
    }

    function handleDeleteExperiment(event) {
        const button = event.target;
        const experimentItem = button.closest('.experiment-item');
        const experimentNameElement = experimentItem.querySelector('.experiment-item-content *');
        const experimentName = experimentNameElement ? experimentNameElement.textContent : 'dit experiment';

        if (confirm(`Weet je zeker dat je '${experimentName}' wilt verwijderen?`)) {
            experimentItem.remove();
        }
    }

    function handleSave() {
        const dataToSave = [];
        rolesContainer.querySelectorAll('.role-column').forEach(column => {
            const roleButton = column.querySelector('.role-button');
            const roleName = roleButton.classList[1]; // Haal de rolnaam uit de class (bv. 'tutor')
            const experiments = [];

            column.querySelectorAll('.experiment-item').forEach(item => {
                const contentElement = item.querySelector('.experiment-item-content *'); // a of span
                const name = contentElement ? contentElement.textContent : '';
                const url = contentElement && contentElement.tagName === 'A' ? contentElement.href : null;
                if (name) { // Voeg alleen toe als er een naam is
                   experiments.push({ name, url });
                }
            });
            dataToSave.push({ role: roleName, experiments });
        });

        const jsonString = JSON.stringify(dataToSave, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-rollen-configuratie.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleLoad(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const loadedData = JSON.parse(e.target.result);
                // Basis validatie (is het een array?)
                if (Array.isArray(loadedData)) {
                     rebuildUI(loadedData);
                } else {
                    alert('Ongeldig JSON formaat. Verwacht een array van rollen.');
                }
            } catch (error) {
                alert(`Fout bij het lezen of parsen van het JSON bestand: ${error.message}`);
            }
        };
        reader.onerror = function() {
             alert('Fout bij het lezen van het bestand.');
        }
        reader.readAsText(file);

        // Reset de input zodat dezelfde file opnieuw geladen kan worden
        loadInput.value = null;
    }

    // Functie om event listeners toe te voegen (herbruikbaar)
    function addEventListeners() {
        // Koppel listeners aan alle huidige knoppen

        // Verwijder knoppen
        rolesContainer.querySelectorAll('.delete-experiment-button').forEach(button => {
             // Direct koppelen ipv clonen voor eenvoud bij laden
             button.removeEventListener('click', handleDeleteExperiment); // Verwijder oude
             button.addEventListener('click', handleDeleteExperiment);    // Voeg nieuwe toe
        });

        // Toevoegen knoppen
        rolesContainer.querySelectorAll('.add-experiment-button').forEach(button => {
             button.removeEventListener('click', handleAddExperiment);
             button.addEventListener('click', handleAddExperiment);
        });
    }

    // --- Initiële Setup ---
    saveButton.addEventListener('click', handleSave);
    loadInput.addEventListener('change', handleLoad);
    addEventListeners(); // Koppel listeners aan de initiele knoppen

}); 