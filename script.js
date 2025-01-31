const API_BASE_URL = 'https://dattebayo-api.onrender.com';
const charactersGrid = document.getElementById('charactersGrid');
const searchInput = document.getElementById('searchInput');
const loadingElement = document.getElementById('loading');

let allCharacters = [];
let currentPage = 1;
let isLoading = false;
let controller = null;

async function fetchCharacters(page = 1, searchTerm = '') {
    // Agregamos un pequeño delay para ver mejor el efecto del AbortController
    await new Promise(resolve => setTimeout(resolve, 500));

    if (controller) {
        controller.abort();
        console.log("Solicitud anterior cancelada");
    }
    
    controller = new AbortController();
    const signal = controller.signal;

    try {
        isLoading = true;
        loadingElement.style.display = 'block';

        let url = `${API_BASE_URL}/characters?page=${page}`;
        if (searchTerm) {
            url += `&name=${encodeURIComponent(searchTerm)}`;
        }

        console.log('Iniciando búsqueda:', url);

        const response = await fetch(url, { 
            signal,
            // Agregamos headers para hacer la petición más visible
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (searchTerm || page === 1) {
            allCharacters = data.characters;
            displayCharacters(data.characters, true);
        } else {
            allCharacters = [...allCharacters, ...data.characters];
            displayCharacters(data.characters, false);
        }
        
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Búsqueda cancelada antes de completarse");
            return;
        }
        console.error('Error al obtener los personajes:', error);
        if (page === 1) {
            charactersGrid.innerHTML = '<p style="color: red; text-align: center;">Error al cargar los personajes.</p>';
        }
    } finally {
        loadingElement.style.display = 'none';
        isLoading = false;
    }
}

function displayCharacters(characters, clear = false) {
    if (clear) {
        charactersGrid.innerHTML = '';
    }

    characters.forEach(character => {
        const characterCard = document.createElement('div');
        characterCard.className = 'character-card';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const characterImage = document.createElement('img');
        let currentImageIndex = 0;
        characterImage.src = character.images[currentImageIndex] || 'https://via.placeholder.com/300';
        characterImage.alt = character.name;
        characterImage.className = 'character-image';

        const characterInfo = document.createElement('div');
        characterInfo.className = 'character-info';

        const characterName = document.createElement('h2');
        characterName.className = 'character-name';
        characterName.textContent = character.name;

        const characterDetails = document.createElement('div');
        characterDetails.className = 'character-details';
        characterDetails.style.display = 'none';

        function updateInfo(index) {
            characterImage.classList.add('fade-out');
            setTimeout(() => {
                characterImage.src = character.images[index] || 'https://via.placeholder.com/300';
                const part = index === 0 ? 'Part I' : 'Part II';
                characterDetails.innerHTML = `
                    <p>Clan: ${character.personal?.clan || 'Desconocido'}</p>
                    <p>Edad: ${character.personal?.age?.[part] || 'Desconocida'}</p>
                    <p>Altura: ${character.personal?.height?.[part] || 'Desconocida'}</p>
                    <p>Peso: ${character.personal?.weight?.[part] || 'Desconocido'}</p>
                    <p>Rango Ninja: ${character.rank?.ninjaRank?.[part] || 'Desconocido'}</p>
                    <p>Estado: ${character.personal?.status || 'Alive'}</p>
                `;
                characterImage.classList.remove('fade-out');
            }, 300);
        }
        
        updateInfo(currentImageIndex);

        if (character.images.length > 1) {
            const nextButton = document.createElement('button');
            nextButton.className = 'next-button';
            nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextButton.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex + 1) % character.images.length;
                updateInfo(currentImageIndex);
            });

            const prevButton = document.createElement('button');
            prevButton.className = 'prev-button';
            prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevButton.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex - 1 + character.images.length) % character.images.length;
                updateInfo(currentImageIndex);
            });

            imageContainer.appendChild(prevButton);
            imageContainer.appendChild(characterImage);
            imageContainer.appendChild(nextButton);
        } else {
            imageContainer.appendChild(characterImage);
        }

        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-button';
        toggleButton.textContent = 'Mostrar más';
        toggleButton.addEventListener('click', () => {
            if (characterDetails.style.display === 'none') {
                characterDetails.style.display = 'block';
                toggleButton.textContent = 'Mostrar menos';
            } else {
                characterDetails.style.display = 'none';
                toggleButton.textContent = 'Mostrar más';
            }
        });

        characterInfo.appendChild(characterName);
        characterInfo.appendChild(toggleButton);
        characterInfo.appendChild(characterDetails);
        
        characterCard.appendChild(imageContainer);
        characterCard.appendChild(characterInfo);
        charactersGrid.appendChild(characterCard);
    });
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    currentPage = 1;
    allCharacters = [];
    fetchCharacters(1, searchTerm);
});

window.addEventListener('scroll', () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.body.offsetHeight;
    
    if (scrollPosition >= documentHeight - 100 && !isLoading && !searchInput.value) {
        currentPage++;
        fetchCharacters(currentPage);
    }
});

// Cargar personajes iniciales
fetchCharacters();